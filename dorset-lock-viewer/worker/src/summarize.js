// Shared formatting of raw Tuya responses, used by the Worker and the sync script.
// Only reshapes what the lock actually reports; never invents values.

// Map Tuya's raw status DP array into a friendly summary without inventing data.
export function summarizeStatus(statusArr) {
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

export const UNLOCK_METHOD = {
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

// Tuya returns seconds or milliseconds depending on the endpoint; normalize to ms.
function toMs(t) {
  if (t == null || t === '') return null;
  if (typeof t === 'number') return t < 1e12 ? t * 1000 : t;
  const n = Number(t);
  if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
  const p = Date.parse(t);
  return Number.isNaN(p) ? null : p;
}

export function summarizeLogs(result) {
  const logs = (result && (result.logs || result.records || result.datas)) || [];
  const entries = logs.map((l) => {
    const code = l.code || l.unlock_type || l.dp_code || '';
    return {
      time: toMs(l.event_time ?? l.time ?? l.gmt_create ?? l.timestamp),
      method: UNLOCK_METHOD[code] || code || 'Unknown',
      methodCode: code,
      who: l.unlock_name || l.user_name || l.nick_name || l.user_id || null,
      raw: l,
    };
  });
  return { entries, hasMore: !!(result && result.has_more), total: entries.length };
}
