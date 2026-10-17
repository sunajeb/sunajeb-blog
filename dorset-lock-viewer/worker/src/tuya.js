// Tuya Cloud API client for Cloudflare Workers (Web Crypto, no deps).
//
// Implements Tuya's v2.0 request signature:
//   - token request:    sign = HMAC-SHA256(client_id + t + nonce + stringToSign, secret)
//   - business request: sign = HMAC-SHA256(client_id + access_token + t + nonce + stringToSign, secret)
//   stringToSign = METHOD \n Content-SHA256 \n (signHeaders) \n (path+sortedQuery)
//
// This module is READ-ONLY by design: it only issues GET requests. There is no
// helper here that can send an unlock/command. Keep it that way for v1.
//
// Docs:
//   Signature:   https://developer.tuya.com/en/docs/iot/new-singnature
//   Device status: GET /v1.0/devices/{id}/status
//   Open logs:   GET /v1.1/devices/{id}/door-lock/open-logs

const EMPTY_BODY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text) {
  if (text === '' || text == null) return EMPTY_BODY_SHA256;
  const data = new TextEncoder().encode(text);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(sig).toUpperCase();
}

// Build "path?sortedquery" exactly as Tuya expects (query keys sorted asc).
function canonicalPath(path, query) {
  const keys = Object.keys(query || {}).filter((k) => query[k] !== undefined && query[k] !== null);
  if (keys.length === 0) return path;
  keys.sort();
  const qs = keys.map((k) => `${k}=${query[k]}`).join('&');
  return `${path}?${qs}`;
}

async function buildSign({ clientId, secret, accessToken, t, nonce, method, bodyHash, url }) {
  const stringToSign = [method, bodyHash, '', url].join('\n');
  const prefix = accessToken
    ? clientId + accessToken + t + nonce
    : clientId + t + nonce;
  return hmacSha256Hex(secret, prefix + stringToSign);
}

// In-isolate token cache (best-effort; a cold isolate just re-fetches).
let _tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken(env) {
  const now = Date.now();
  if (_tokenCache.token && now < _tokenCache.expiresAt - 60_000) {
    return _tokenCache.token;
  }
  const endpoint = (env.TUYA_ENDPOINT || 'https://openapi.tuyain.com').replace(/\/$/, '');
  const path = '/v1.0/token';
  const query = { grant_type: '1' };
  const url = canonicalPath(path, query);
  const t = String(Date.now());
  const nonce = crypto.randomUUID();
  const bodyHash = await sha256Hex('');
  const sign = await buildSign({
    clientId: env.TUYA_ACCESS_ID,
    secret: env.TUYA_ACCESS_SECRET,
    accessToken: '',
    t,
    nonce,
    method: 'GET',
    bodyHash,
    url,
  });

  const resp = await fetch(endpoint + url, {
    method: 'GET',
    headers: {
      client_id: env.TUYA_ACCESS_ID,
      sign,
      t,
      sign_method: 'HMAC-SHA256',
      nonce,
    },
  });
  const data = await resp.json();
  if (!data.success) {
    throw new TuyaError('token', data.code, data.msg || 'token request failed', data);
  }
  _tokenCache = {
    token: data.result.access_token,
    expiresAt: Date.now() + data.result.expire_time * 1000,
  };
  return _tokenCache.token;
}

// GET a business API path. `query` is an optional object of query params.
async function tuyaGet(env, path, query) {
  const endpoint = (env.TUYA_ENDPOINT || 'https://openapi.tuyain.com').replace(/\/$/, '');
  const accessToken = await getAccessToken(env);
  const url = canonicalPath(path, query);
  const t = String(Date.now());
  const nonce = crypto.randomUUID();
  const bodyHash = await sha256Hex('');
  const sign = await buildSign({
    clientId: env.TUYA_ACCESS_ID,
    secret: env.TUYA_ACCESS_SECRET,
    accessToken,
    t,
    nonce,
    method: 'GET',
    bodyHash,
    url,
  });

  const resp = await fetch(endpoint + url, {
    method: 'GET',
    headers: {
      client_id: env.TUYA_ACCESS_ID,
      access_token: accessToken,
      sign,
      t,
      sign_method: 'HMAC-SHA256',
      nonce,
    },
  });
  const data = await resp.json();
  if (!data.success) {
    // 1010 = token invalid/expired: clear cache so the next call re-fetches.
    if (data.code === 1010 || data.code === 1011) _tokenCache = { token: null, expiresAt: 0 };
    throw new TuyaError('api', data.code, data.msg || 'Tuya API error', data);
  }
  return data.result;
}

class TuyaError extends Error {
  constructor(scope, code, msg, raw) {
    super(`[tuya:${scope}] ${code}: ${msg}`);
    this.scope = scope;
    this.code = code;
    this.tuyaMsg = msg;
    this.raw = raw;
  }
}

// ---- Read-only domain calls -------------------------------------------------

export async function getDeviceStatus(env, deviceId) {
  // Returns the raw status DP array: [{code, value}, ...]
  return tuyaGet(env, `/v1.0/devices/${deviceId}/status`);
}

export async function getDeviceInfo(env, deviceId) {
  return tuyaGet(env, `/v1.0/devices/${deviceId}`);
}

export async function getOpenLogs(env, deviceId, { pageSize = 20, startTime, endTime, codes } = {}) {
  // Door-lock unlock/alert history. Times are epoch milliseconds.
  const now = Date.now();
  const query = {
    page_size: pageSize,
    start_time: startTime ?? now - 7 * 24 * 60 * 60 * 1000, // default: last 7 days
    end_time: endTime ?? now,
  };
  if (codes) query.codes = codes;
  // v1.1 supports Wi-Fi locks (incl. video-talk). Fall back to v1.0 on 1106/28841002.
  try {
    return await tuyaGet(env, `/v1.1/devices/${deviceId}/door-lock/open-logs`, query);
  } catch (e) {
    if (e instanceof TuyaError && e.scope === 'api') {
      return await tuyaGet(env, `/v1.0/devices/${deviceId}/door-lock/open-logs`, query);
    }
    throw e;
  }
}

export { TuyaError };
