// The phone UI, served by the ESP itself. Plain HTML/CSS/JS, no dependencies,
// so it works with no internet. Edit freely, then re-upload the sketch.
#pragma once
#include <Arduino.h>

const char WEB_UI_MANIFEST[] PROGMEM = R"JSON({
  "name": "AC Remote",
  "short_name": "AC",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1115",
  "theme_color": "#0f1115"
})JSON";

const char WEB_UI_HTML[] PROGMEM = R"HTML(<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="AC">
<meta name="theme-color" content="#0f1115">
<link rel="manifest" href="/manifest.json">
<title>AC Remote</title>
<style>
  :root {
    --bg: #f4f5f7; --card: #ffffff; --text: #14161a; --muted: #6b7280;
    --line: #e5e7eb; --accent: #2563eb; --accent-text: #ffffff;
    --heat: #ea580c; --off: #9ca3af;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1115; --card: #181b21; --text: #f3f4f6; --muted: #9ca3af;
      --line: #2a2e36; --accent: #3b82f6; --accent-text: #ffffff;
      --heat: #f97316; --off: #4b5563;
    }
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 16px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
  }
  main { max-width: 420px; margin: 0 auto; display: grid; gap: 14px; }
  header { display: flex; justify-content: space-between; align-items: center; }
  h1 { font-size: 20px; margin: 0; }
  #status { font-size: 13px; color: var(--muted); }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 18px; }

  .dial { text-align: center; }
  .dial .mode-label { color: var(--muted); font-size: 14px; text-transform: uppercase; letter-spacing: .08em; }
  .temp { font-size: 88px; font-weight: 200; line-height: 1; margin: 8px 0 14px; font-variant-numeric: tabular-nums; }
  .temp sup { font-size: 32px; vertical-align: top; position: relative; top: 14px; }
  .off .temp, .off .mode-label { color: var(--off); }
  .steppers { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  button {
    font: inherit; color: var(--text); background: var(--bg); border: 1px solid var(--line);
    border-radius: 14px; padding: 14px 8px; cursor: pointer; touch-action: manipulation;
  }
  button:active { transform: scale(.97); }
  .big { font-size: 28px; padding: 10px; }
  #power {
    width: 100%; font-size: 18px; font-weight: 600; padding: 18px;
    background: var(--accent); color: var(--accent-text); border-color: transparent;
  }
  .off #power { background: var(--card); color: var(--text); border-color: var(--line); }

  .label { font-size: 13px; color: var(--muted); margin: 0 0 8px; }
  .chips { display: grid; gap: 8px; }
  .chips.five { grid-template-columns: repeat(5, 1fr); }
  .chips button { font-size: 13px; padding: 12px 2px; }
  .chips button[aria-pressed="true"] { background: var(--accent); color: var(--accent-text); border-color: transparent; }
  .chips button[data-v="heat"][aria-pressed="true"] { background: var(--heat); }
  .row { display: flex; justify-content: space-between; align-items: center; }
  .switch { width: 56px; height: 32px; border-radius: 99px; padding: 0; position: relative; }
  .switch::after {
    content: ""; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px;
    border-radius: 50%; background: var(--muted); transition: left .15s;
  }
  .switch[aria-pressed="true"] { background: var(--accent); border-color: transparent; }
  .switch[aria-pressed="true"]::after { left: 27px; background: #fff; }
  .note { font-size: 12px; color: var(--muted); text-align: center; }
</style>
</head>
<body>
<main id="app" class="off">
  <header><h1>Air Conditioner</h1><span id="status">Connecting…</span></header>

  <section class="card dial">
    <div class="mode-label" id="modeLabel">Off</div>
    <div class="temp"><span id="temp">24</span><sup>°C</sup></div>
    <div class="steppers">
      <button class="big" id="down" aria-label="Cooler">−</button>
      <button class="big" id="up" aria-label="Warmer">+</button>
    </div>
  </section>

  <button id="power">Turn on</button>

  <section class="card">
    <p class="label">Mode</p>
    <div class="chips five" data-key="mode">
      <button data-v="cool">❄️<br>Cool</button>
      <button data-v="heat">🔥<br>Heat</button>
      <button data-v="dry">💧<br>Dry</button>
      <button data-v="fan">🌀<br>Fan</button>
      <button data-v="auto">✨<br>Auto</button>
    </div>
  </section>

  <section class="card">
    <p class="label">Fan speed</p>
    <div class="chips five" data-key="fan">
      <button data-v="auto">Auto</button>
      <button data-v="quiet">Quiet</button>
      <button data-v="low">Low</button>
      <button data-v="med">Med</button>
      <button data-v="high">High</button>
    </div>
  </section>

  <section class="card row">
    <span>Swing</span>
    <button class="switch" id="swing" aria-label="Swing" aria-pressed="false"></button>
  </section>

  <p class="note">IR is one-way: this shows the last command sent, not what the AC reports.</p>
</main>

<script>
const $ = (id) => document.getElementById(id);
const MODE_NAMES = { cool: "Cooling", heat: "Heating", dry: "Dry", fan: "Fan only", auto: "Auto" };
let state = { power: false, mode: "cool", temp: 24, fan: "auto", swing: false };
let pin = "";
try { pin = localStorage.getItem("acPin") || ""; } catch (e) {}

function render() {
  $("app").classList.toggle("off", !state.power);
  $("temp").textContent = state.temp;
  $("modeLabel").textContent = state.power ? MODE_NAMES[state.mode] : "Off";
  $("power").textContent = state.power ? "Turn off" : "Turn on";
  $("swing").setAttribute("aria-pressed", state.swing);
  document.querySelectorAll(".chips").forEach((group) => {
    group.querySelectorAll("button").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.v === state[group.dataset.key]));
  });
}

function setStatus(t) { $("status").textContent = t; }

async function send(changes) {
  Object.assign(state, changes);
  render();
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(changes)) q.set(k, typeof v === "boolean" ? (v ? 1 : 0) : v);
  setStatus("Sending…");
  try {
    const r = await fetch("/api/state?" + q, { method: "POST", headers: { "X-Pin": pin } });
    if (r.status === 401) {
      pin = prompt("Enter the AC PIN") || "";
      try { localStorage.setItem("acPin", pin); } catch (e) {}
      return send(changes);
    }
    state = await r.json();
    if (pendingTemp !== null) state.temp = pendingTemp;  // don't clobber a +/- still in flight
    render();
    setStatus("Sent ✓");
    if (navigator.vibrate) navigator.vibrate(15);
  } catch (e) {
    setStatus("Offline ✕");
  }
}

// Wait until the user stops tapping +/- before firing the IR, so ten taps = one beep.
let tempTimer, pendingTemp = null;
function bumpTemp(d) {
  pendingTemp = Math.min(30, Math.max(16, (pendingTemp ?? state.temp) + d));
  state.temp = pendingTemp;
  render();
  clearTimeout(tempTimer);
  tempTimer = setTimeout(() => { const t = pendingTemp; pendingTemp = null; send({ temp: t }); }, 500);
}

$("up").onclick = () => bumpTemp(1);
$("down").onclick = () => bumpTemp(-1);
$("power").onclick = () => send({ power: !state.power });
$("swing").onclick = () => send({ swing: !state.swing });
document.querySelectorAll(".chips").forEach((group) => {
  group.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) send({ [group.dataset.key]: b.dataset.v });
  });
});

fetch("/api/state").then((r) => r.json()).then((s) => {
  state = s; render(); setStatus("Connected");
}).catch(() => setStatus("Offline ✕"));
render();
</script>
</body>
</html>)HTML";
