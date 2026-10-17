// Dorset Lock Viewer — private backend (Cloudflare Worker), v1: READ-ONLY.
//
// Holds the Tuya keys (as Worker secrets) and exposes only two read endpoints to
// the web UI. There is intentionally NO endpoint that can unlock the door.
//
// Secrets (set with `wrangler secret put`):
//   TUYA_ACCESS_ID, TUYA_ACCESS_SECRET, APP_TOKEN
// Vars (wrangler.toml [vars] or dashboard):
//   TUYA_ENDPOINT (default https://openapi.tuyain.com), TUYA_DEVICE_ID, ALLOWED_ORIGIN

import { getDeviceStatus, getDeviceInfo, getOpenLogs, TuyaError } from './tuya.js';

function corsHeaders(env, req) {
  const allow = env.ALLOWED_ORIGIN || '*';
  const origin = req.headers.get('Origin') || '';
  // If a specific origin is configured, echo it only when it matches.
  const allowOrigin = allow === '*' ? '*' : (origin === allow ? allow : allow);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(extraHeaders || {}) },
  });
}

// Constant-time-ish compare for the shared app token.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(req, env) {
  const hdr = req.headers.get('Authorization') || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return safeEqual(m[1], env.APP_TOKEN || '');
}

// Map Tuya's raw status DP array into a friendly summary without inventing data.
function summarizeStatus(statusArr) {
  const byCode = {};
  for (const dp of statusArr || []) byCode[dp.code] = dp.value;
  const pick = (...codes) => {
    for (const c of codes) if (c in byCode) return { code: c, value: byCode[c] };
    return null;
  };
  return {
    raw: statusArr,
    battery: pick('battery_percentage', 'residual_electricity', 'battery_state'),
    // Common Tuya lock DP names; present only if the device actually reports them.
    closed: pick('closed_opened', 'door_state', 'lock_motor_state'),
    tamper: pick('hijack', 'doorbell', 'alarm_lock'),
  };
}

const UNLOCK_METHOD = {
  // Tuya "open-logs" unlock_type / stage codes → human labels (best-effort).
  unlock_fingerprint: 'Fingerprint',
  unlock_password: 'PIN / password',
  unlock_temporary: 'Temporary PIN',
  unlock_dynamic: 'Dynamic PIN',
  unlock_card: 'Card',
  unlock_app: 'App',
  unlock_key: 'Mechanical key',
  unlock_face: 'Face',
  unlock_finger_vein: 'Finger vein',
  unlock_phone_remote: 'Remote (app)',
  unlock_voice_remote: 'Remote (voice)',
  unlock_ble: 'Bluetooth',
};

function summarizeLogs(result) {
  const logs = (result && (result.logs || result.records || result.datas)) || [];
  const entries = logs.map((l) => {
    const code = l.code || l.unlock_type || l.dp_code || '';
    return {
      time: l.event_time || l.time || l.gmt_create || l.timestamp || null,
      method: UNLOCK_METHOD[code] || code || 'Unknown',
      methodCode: code,
      who: l.unlock_name || l.user_name || l.nick_name || l.user_id || null,
      raw: l,
    };
  });
  return { entries, hasMore: !!(result && result.has_more), total: entries.length };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(env, request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Public health check (no secrets, no device data).
    if (url.pathname === '/api/health') {
      return json(
        { ok: true, service: 'dorset-lock-viewer', mode: 'read-only', configured: !!(env.TUYA_ACCESS_ID && env.TUYA_DEVICE_ID) },
        200,
        cors,
      );
    }

    if (request.method !== 'GET') {
      return json({ error: 'method_not_allowed' }, 405, cors);
    }

    if (!authorized(request, env)) {
      return json({ error: 'unauthorized', hint: 'Send Authorization: Bearer <APP_TOKEN>' }, 401, cors);
    }

    const deviceId = env.TUYA_DEVICE_ID;
    if (!env.TUYA_ACCESS_ID || !env.TUYA_ACCESS_SECRET || !deviceId) {
      return json({ error: 'not_configured', hint: 'Set TUYA_ACCESS_ID/SECRET and TUYA_DEVICE_ID' }, 503, cors);
    }

    try {
      if (url.pathname === '/api/status') {
        const [status, info] = await Promise.all([
          getDeviceStatus(env, deviceId),
          getDeviceInfo(env, deviceId).catch(() => null),
        ]);
        return json(
          {
            online: info ? info.online : null,
            name: info ? info.name : null,
            status: summarizeStatus(status),
            fetchedAt: Date.now(),
          },
          200,
          cors,
        );
      }

      if (url.pathname === '/api/entry-log') {
        const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '20', 10) || 20, 100);
        const startTime = url.searchParams.get('start_time');
        const endTime = url.searchParams.get('end_time');
        const result = await getOpenLogs(env, deviceId, {
          pageSize,
          startTime: startTime ? parseInt(startTime, 10) : undefined,
          endTime: endTime ? parseInt(endTime, 10) : undefined,
        });
        return json({ ...summarizeLogs(result), fetchedAt: Date.now() }, 200, cors);
      }

      return json({ error: 'not_found' }, 404, cors);
    } catch (e) {
      const payload =
        e instanceof TuyaError
          ? { error: 'tuya_error', scope: e.scope, code: e.code, message: e.tuyaMsg }
          : { error: 'server_error', message: String(e && e.message ? e.message : e) };
      return json(payload, 502, cors);
    }
  },
};
