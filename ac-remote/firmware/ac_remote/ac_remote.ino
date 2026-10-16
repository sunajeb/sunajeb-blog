// O General (Fujitsu General) AC remote — Wi-Fi to IR bridge.
//
// An ESP32 / ESP8266 joins your Wi-Fi, serves a phone-friendly control page,
// and blasts the same infrared codes your O General remote sends.
//
// Libraries (Arduino IDE > Library Manager):
//   - IRremoteESP8266 (by David Conran / crankyoldgit), v2.8.6 or newer
//
// Board: any ESP32 dev board, or an ESP8266 (NodeMCU / Wemos D1 mini).

#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <ir_Fujitsu.h>

#if defined(ESP32)
  #include <WiFi.h>
  #include <WebServer.h>
  #include <ESPmDNS.h>
  typedef WebServer HttpServer;
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
  #include <ESP8266mDNS.h>
  typedef ESP8266WebServer HttpServer;
#else
  #error "This sketch needs an ESP32 or ESP8266 board."
#endif

#include "secrets.h"
#include "web_ui.h"

// ---- Config ---------------------------------------------------------------

// GPIO driving the IR LED (through a transistor). GPIO4 = "D2" on NodeMCU/D1 mini.
const uint16_t kIrLedPin = 4;

// Which O General / Fujitsu remote your AC uses. Look at the model printed on
// the back of your remote. Common O General ones:
//   AR-RAH2E / AR-RCL1E / AR-RCE1E / AR-RAE* -> ARRAH2E  (default, most split ACs)
//   AR-REW4E / AR-REW*         -> ARREW4E
//   AR-REB1E                   -> ARREB1E
//   AR-DB1 / AR-DL*            -> ARDB1
//   AR-JW2                     -> ARJW2
//   AR-RY4                     -> ARRY4
// If the AC ignores commands, try the next model in this list.
const fujitsu_ac_remote_model_t kRemoteModel = ARRAH2E;

// http://<kHostname>.local on iPhone / Mac / Windows.
const char *kHostname = "ac";

// ---- State ----------------------------------------------------------------

// IR is one-way: the AC never reports back, so we remember the last state
// we sent and show that in the UI.
struct AcState {
  bool power = false;
  String mode = "cool";  // auto | cool | dry | fan | heat
  int temp = 24;         // 16..30 °C
  String fan = "auto";   // auto | high | med | low | quiet
  bool swing = false;    // vertical louver swing
};

AcState state;
IRFujitsuAC ac(kIrLedPin, kRemoteModel);
HttpServer server(80);

uint8_t modeFromString(const String &m) {
  if (m == "auto") return kFujitsuAcModeAuto;
  if (m == "dry")  return kFujitsuAcModeDry;
  if (m == "fan")  return kFujitsuAcModeFan;
  if (m == "heat") return kFujitsuAcModeHeat;
  return kFujitsuAcModeCool;
}

uint8_t fanFromString(const String &f) {
  if (f == "high")  return kFujitsuAcFanHigh;
  if (f == "med")   return kFujitsuAcFanMed;
  if (f == "low")   return kFujitsuAcFanLow;
  if (f == "quiet") return kFujitsuAcFanQuiet;
  return kFujitsuAcFanAuto;
}

bool isOneOf(const String &v, const char *const *opts, size_t n) {
  for (size_t i = 0; i < n; i++) if (v == opts[i]) return true;
  return false;
}

// Send the full state to the AC. `wasOn` tells the protocol whether this is a
// "turn on" frame or a "stay on, just change settings" frame.
void transmit(bool wasOn) {
  if (!state.power) {
    ac.off();
  } else {
    ac.setMode(modeFromString(state.mode));
    ac.setTemp(state.temp);
    ac.setFanSpeed(fanFromString(state.fan));
    ac.setSwing(state.swing ? kFujitsuAcSwingVert : kFujitsuAcSwingOff);
    ac.setCmd(wasOn ? kFujitsuAcCmdStayOn : kFujitsuAcCmdTurnOn);
  }
  ac.send();
  Serial.printf("IR sent: %s\n", ac.toString().c_str());
}

String stateJson() {
  String j = "{";
  j += "\"power\":" + String(state.power ? "true" : "false");
  j += ",\"mode\":\"" + state.mode + "\"";
  j += ",\"temp\":" + String(state.temp);
  j += ",\"fan\":\"" + state.fan + "\"";
  j += ",\"swing\":" + String(state.swing ? "true" : "false");
  j += ",\"pinRequired\":" + String(strlen(ACCESS_PIN) ? "true" : "false");
  j += "}";
  return j;
}

bool authorized() {
  if (strlen(ACCESS_PIN) == 0) return true;
  if (server.header("X-Pin") == ACCESS_PIN) return true;
  server.send(401, "application/json", "{\"error\":\"bad pin\"}");
  return false;
}

// ---- HTTP handlers ---------------------------------------------------------

void handleRoot() {
  server.send_P(200, "text/html", WEB_UI_HTML);
}

void handleManifest() {
  server.send_P(200, "application/manifest+json", WEB_UI_MANIFEST);
}

void handleGetState() {
  server.send(200, "application/json", stateJson());
}

// POST /api/state?power=1&mode=cool&temp=24&fan=auto&swing=0
// Any subset of params is fine; missing ones keep their current value.
void handleSetState() {
  if (!authorized()) return;

  static const char *const kModes[] = {"auto", "cool", "dry", "fan", "heat"};
  static const char *const kFans[] = {"auto", "high", "med", "low", "quiet"};
  bool wasOn = state.power;

  if (server.hasArg("power")) state.power = server.arg("power") == "1";
  if (server.hasArg("mode") && isOneOf(server.arg("mode"), kModes, 5))
    state.mode = server.arg("mode");
  if (server.hasArg("temp"))
    state.temp = constrain((int)server.arg("temp").toInt(), 16, 30);
  if (server.hasArg("fan") && isOneOf(server.arg("fan"), kFans, 5))
    state.fan = server.arg("fan");
  if (server.hasArg("swing")) state.swing = server.arg("swing") == "1";

  // Changing settings while the AC is off just updates what we'll send on
  // next power-on; don't wake the AC up.
  if (state.power || wasOn) transmit(wasOn);

  server.send(200, "application/json", stateJson());
}

// ---- Setup / loop ------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(200);
  ac.begin();

  WiFi.mode(WIFI_STA);
#if defined(ESP32)
  WiFi.setHostname(kHostname);
#else
  WiFi.hostname(kHostname);
#endif
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConnected! Open http://%s/  or  http://%s.local/\n",
                WiFi.localIP().toString().c_str(), kHostname);

  if (MDNS.begin(kHostname)) MDNS.addService("http", "tcp", 80);

  const char *headers[] = {"X-Pin"};
  server.collectHeaders(headers, 1);
  server.on("/", HTTP_GET, handleRoot);
  server.on("/manifest.json", HTTP_GET, handleManifest);
  server.on("/api/state", HTTP_GET, handleGetState);
  server.on("/api/state", HTTP_POST, handleSetState);
  server.begin();
}

void loop() {
  server.handleClient();
#if defined(ESP8266)
  MDNS.update();
#endif
  // Wi-Fi drops happen; the ESP core reconnects on its own.
}
