// Pull the lock's status and entry log from Tuya Cloud (read-only) and write the
// JSON document the Artifact displays. Claude writes that file into the
// Artifact's database (document `lock/state`).
//
// Credentials come only from environment variables, never from this repo:
//   TUYA_ACCESS_ID, TUYA_ACCESS_SECRET, TUYA_DEVICE_ID, TUYA_ENDPOINT (optional)
//
// Usage: node sync/sync.mjs [out.json]

import { writeFile } from 'node:fs/promises';
import { getDeviceStatus, getDeviceInfo, getOpenLogs } from '../worker/src/tuya.js';
import { summarizeStatus, summarizeLogs } from '../worker/src/summarize.js';

const MAX_ENTRIES = 100;
const out = process.argv[2] || 'lock-state.json';
const env = process.env;

for (const k of ['TUYA_ACCESS_ID', 'TUYA_ACCESS_SECRET', 'TUYA_DEVICE_ID']) {
  if (!env[k]) {
    console.error(`Missing environment variable ${k}`);
    process.exit(2);
  }
}

const deviceId = env.TUYA_DEVICE_ID;
const doc = { syncedAt: Date.now(), source: 'tuya-cloud', errors: [] };

try {
  const info = await getDeviceInfo(env, deviceId);
  doc.device = {
    name: info.name ?? null,
    online: info.online ?? null,
    model: info.model ?? info.product_name ?? null,
    category: info.category ?? null,
  };
} catch (e) {
  doc.errors.push({ step: 'device', message: e.message });
}

try {
  const s = summarizeStatus(await getDeviceStatus(env, deviceId));
  doc.status = { battery: s.battery, closed: s.closed, tamper: s.tamper };
  doc.raw = s.raw || [];
} catch (e) {
  doc.errors.push({ step: 'status', message: e.message });
}

try {
  const logs = summarizeLogs(await getOpenLogs(env, deviceId, { pageSize: MAX_ENTRIES }));
  const entries = logs.entries
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
    .slice(0, MAX_ENTRIES);
  // Keep a few raw records so field names can be mapped for this lock model.
  doc.rawLogSample = entries.slice(0, 3).map((e) => e.raw);
  doc.entries = entries.map(({ raw, ...rest }) => rest);
} catch (e) {
  doc.errors.push({ step: 'entry-log', message: e.message });
}

await writeFile(out, JSON.stringify(doc, null, 2));
console.log(
  `wrote ${out}: device=${doc.device ? 'ok' : 'failed'} status=${doc.status ? 'ok' : 'failed'} ` +
    `entries=${doc.entries ? doc.entries.length : 'failed'} errors=${doc.errors.length}`,
);
if (doc.errors.length) for (const e of doc.errors) console.log(`  ${e.step}: ${e.message}`);
