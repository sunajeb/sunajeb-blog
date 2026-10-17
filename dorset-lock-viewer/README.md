# Dorset Lock Viewer (v1 — read-only)

A tiny, **view-only** web app for a Dorset smart lock (which runs on **Tuya**).
It shows the lock's **status** and a **live entry log** (who entered — fingerprint /
PIN / app — and when).

**It cannot unlock the door.** There is intentionally no unlock endpoint anywhere
in the code. Remote unlock, notifications and camera are deliberately left for later
phases.

```
 iPhone Safari
     │
     ▼
 web/index.html   ── view-only UI (holds NO secrets; calls your backend)
     │
     ▼
 worker/          ── Cloudflare Worker: holds Tuya keys, signs requests,
     │               exposes only GET /api/status and GET /api/entry-log
     ▼
 Tuya India Cloud (openapi.tuyain.com)
     │
     ▼
 your Dorset lock
```

## What you need first (one-time)

1. **A free Tuya IoT developer account** → https://iot.tuya.com
2. Create a **Cloud project**:
   - Data Center: **India** (matches an India app account).
   - Authorize these API services: **IoT Core**, **Device Status Notification**,
     and **Smart Lock** (the last one powers the unlock/open-log history;
     some lock/video features are paid value-added services — see Notes).
3. In the project → **Link Tuya App Account** → **Add App Account** → scan the QR
   code with your **Dorset Smart Life** app. Your lock now appears under **Devices**.
4. Note three things:
   - **Access ID** and **Access Secret** (project → Overview).
   - **Device ID** of the lock (project → Devices → your lock).

## Deploy the backend (Cloudflare Worker — free tier is fine)

```bash
cd worker
npm install
npx wrangler login

# non-secret config: set your device id (and lock the UI origin later)
#   edit wrangler.toml → TUYA_DEVICE_ID, ALLOWED_ORIGIN

# secrets (never stored in the repo):
npx wrangler secret put TUYA_ACCESS_ID
npx wrangler secret put TUYA_ACCESS_SECRET
npx wrangler secret put APP_TOKEN        # invent a long random string; the UI uses it

npx wrangler deploy
```

You'll get a URL like `https://dorset-lock-viewer.<your>.workers.dev`.
Check it: `curl https://.../api/health` → `{"ok":true,...}`.

### Local test (optional)
```bash
cd worker
cp .dev.vars.example .dev.vars   # fill in real values; .dev.vars is gitignored
npx wrangler dev
```

## Use the UI

Open `web/index.html` (or publish it as a claude.ai Artifact). Tap **Settings**,
enter your **Backend URL** and **App token**, then **Save & connect**. The page
polls every 15s and shows status + the entry log. Values stay in your browser only.

> Security: once it works, set `ALLOWED_ORIGIN` in `wrangler.toml` to your UI's
> exact origin and redeploy, so the backend only answers your app. The `APP_TOKEN`
> keeps the "who's home" feed from being readable by anyone with the URL.

## Notes / honest caveats

- **Untested against a real lock here.** The code issues real, correctly-signed
  Tuya calls, but nothing is faked — until you deploy with your keys and a linked
  device, the UI shows "not connected" / real errors, never sample data.
- **Endpoints used:** `GET /v1.0/devices/{id}/status`, `GET /v1.0/devices/{id}`,
  `GET /v1.1/devices/{id}/door-lock/open-logs` (falls back to v1.0).
- **Field names vary by lock model.** `worker/src/tuya.js` maps common Tuya lock
  DP codes; if your DG-xxx reports different codes, we adjust the small maps in
  `summarizeStatus` / `UNLOCK_METHOD` once we see real output.
- **Trial plan can expire** on Tuya's side; some lock/camera data is paid VAS.
- Later phases (notifications → unlock → camera → more devices) are separate,
  each added deliberately and never made publicly reachable.
