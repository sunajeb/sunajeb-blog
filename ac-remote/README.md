# AC Remote: control an O General AC from your phone

A ~$6 ESP board plus an infrared LED sits near the AC and acts as a Wi-Fi remote.
It serves a small web page; open it on your phone (and "Add to Home Screen" for an app icon)
to set power, mode, temperature, fan speed and swing.

```
Phone ──Wi-Fi──▶ ESP32 / ESP8266 (web page + API) ──infrared──▶ O General AC
```

O General is Fujitsu General, so it uses the Fujitsu IR protocol, which the
[IRremoteESP8266](https://github.com/crankyoldgit/IRremoteESP8266) library already supports.
Your AC doesn't need Wi-Fi of its own.

## Shopping list

| Part | Notes |
|---|---|
| ESP32 dev board **or** ESP8266 (NodeMCU / Wemos D1 mini) | Either works |
| 940 nm IR LED (5 mm) | Two in parallel give better range |
| NPN transistor: 2N2222, BC547 or S8050 | Lets the LED draw more current than a GPIO can supply |
| 1 kΩ resistor | Base resistor |
| 47–100 Ω resistor | LED current limit |
| USB phone charger + cable | Power |

No-solder option: an ESP32 board with a built-in IR transmitter (e.g. M5Stack Atom Lite, IR on GPIO 12)
works too. Change `kIrLedPin` to match.

## Wiring

```
GPIO4 (D2) ──[1kΩ]──▶ Base   (transistor)
                       Collector ──── IR LED cathode (short leg)
                       Emitter ────── GND
5V / VIN ──[68Ω]──── IR LED anode (long leg)
```

Point the LED at the AC's indoor unit, near where the original remote's signal lands (usually the right-hand side of the unit).

## Flash it

1. Install the [Arduino IDE](https://www.arduino.cc/en/software).
2. Add your board: *Settings → Additional boards manager URLs*
   - ESP32: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
   - ESP8266: `https://arduino.esp8266.com/stable/package_esp8266com_index.json`

   Then install **esp32** or **esp8266** in the Boards Manager.
3. In the Library Manager, install **IRremoteESP8266**.
4. In `firmware/ac_remote/`, copy `secrets.example.h` to `secrets.h` and fill in your Wi-Fi name and password.
5. Check the model on the back of your remote and set `kRemoteModel` in `ac_remote.ino`.
   If you're not sure, leave it on `ARRAH2E`; most O General split ACs use that.
6. Open `ac_remote.ino`, choose your board and port, and click **Upload**.
7. Open the Serial Monitor (115200 baud). It prints the address, e.g. `http://192.168.1.42/`.

## Use it

- Open `http://ac.local` (iPhone/Mac) or the IP address from step 7 (most Android phones).
- **iPhone:** Share → *Add to Home Screen*. **Android/Chrome:** ⋮ → *Add to Home screen*.
  You get a full-screen app icon.
- Tip: in your router, give the ESP a fixed IP so the address never changes.

## If the AC doesn't respond

1. Check the LED is firing: point your phone's camera at it while pressing a button
   (front cameras usually show IR as a purple flash).
2. Try the next `kRemoteModel` in the list in `ac_remote.ino`.
3. Still nothing? Wire an IR receiver (TSOP38238) to a spare pin, run the library's
   *IRrecvDumpV2* example, and press buttons on your real remote. It prints the
   protocol and model to use.

## Notes and limits

- **IR is one-way.** The AC can't report its real state, so the page shows the
  last command it sent. If someone uses the physical remote, the page won't know until you change something.
- State resets to defaults when the ESP reboots.
- **Local network only.** For remote access from outside home, use [Tailscale](https://tailscale.com/)
  on your phone plus a device at home, or move the firmware to ESPHome with Home Assistant.
  Don't port-forward this to the internet.
- Optional: set `ACCESS_PIN` in `secrets.h` so guests on your Wi-Fi need a PIN.

## API

| Method | Path | Example |
|---|---|---|
| `GET` | `/api/state` | `{"power":true,"mode":"cool","temp":24,"fan":"auto","swing":false}` |
| `POST` | `/api/state?power=1&mode=cool&temp=24&fan=low&swing=0` | Any subset of params |

`mode`: `auto|cool|dry|fan|heat` · `fan`: `auto|quiet|low|med|high` · `temp`: 16–30.
You can call this from iOS Shortcuts too: a "Get contents of URL" action with method POST
gives you a Siri command like "Hey Siri, AC on".
