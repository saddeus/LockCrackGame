# Lock Crack — standalone hardware build

A fully self-contained version of the game: no browser, no computer, no
cloud. Everything — dial input, OLED display, sound, LEDs, and the
leaderboard — runs on a single Adafruit RP2040 Prop-Maker Feather.

## Parts

- Adafruit RP2040 Prop-Maker Feather (#5768)
- CNC Rotary Encoder, 100 Pulses/Rotation (#5734) — same one used in the
  web version
- 1.3" 128x64 monochrome OLED, STEMMA QT (#938)
- 3W 4Ω speaker (#4445)
- 2 momentary buttons (Confirm, Back/Menu)
- 2 single-color LEDs + ~330Ω resistors (correct/wrong indicators)

USB-powered only — no battery in this build.

## Wiring

See `pins.py` for the exact GPIO assignments (change them there if you
wire it up differently — nothing else in this codebase references
`board.*` pins directly).

- **Encoder**: VCC → `3V`, GND → `GND`, A → `pins.ENCODER_A`, B →
  `pins.ENCODER_B`. Same 4-wire pattern as the web version's
  `firmware/README.md` — this encoder has its own pull-ups referenced to
  its VCC terminal, so 3.3V in keeps A/B directly compatible with the
  board's logic inputs. No external pull-ups needed.
- **Buttons**: one leg to `pins.BUTTON_CONFIRM` / `pins.BUTTON_BACK`, the
  other leg to `GND`. Internal pull-ups are enabled in software.
- **LEDs**: `pins.LED_CORRECT` / `pins.LED_WRONG` → ~330Ω resistor → LED
  anode → LED cathode → `GND`.
- **OLED**: plug into the board's onboard STEMMA QT connector with a
  STEMMA QT cable. No soldering.
- **Speaker**: both wires straight to the amp's screw terminals — no
  headphone jack or extra circuitry needed, the onboard MAX98357 amp
  drives it directly.

## Flashing

1. Install CircuitPython on the Prop-Maker Feather
   (circuitpython.org/board/adafruit_feather_rp2040_prop_maker).
2. Install these libraries onto `CIRCUITPY/lib/` from the Adafruit
   CircuitPython bundle: `adafruit_displayio_ssd1306`,
   `adafruit_display_text`.
3. Copy every file in this `standalone/` folder (`code.py`, `boot.py`,
   `pins.py`, `leaderboard.py`, `game/`, `hardware/`) onto `CIRCUITPY`,
   preserving the folder structure.

## First boot: calibration

The rotary encoder has no absolute position sense — it only counts
relative motion from wherever it happens to be at power-on, with no idea
where the knob's physical top notch is. So every power-up starts with a
**Calibrate** screen: turn the knob until its notch points to the top,
then press Confirm. That position becomes dial `0` for the rest of the
session. This isn't saved across reboots (the knob could get bumped), so
it runs once every time the board powers up.

## Storage note (important)

By default, the board's flash is writable from a computer over USB but
**read-only to the running code** — which means it can't save the
leaderboard. `boot.py` flips this at every power-on: CircuitPython gets
write access (so scores save), and the drive becomes read-only from the
computer's side while the game is running.

**To edit code again**, hold the Back/Menu button while powering on —
that skips the remount and gives the computer write access back, same as
a normal CircuitPython board.

## Differences from the web version

- Confirm is a real button press, not a dwell-timeout — no accidental
  penalties from pausing to think mid-search.
- Leaderboard is local (top 10 per difficulty, on-device JSON file), not
  cloud/Supabase — this board has no WiFi. No per-question history
  drill-down either (kept web-only; the 128x64 screen and "compact like
  an old arcade" ask both favor keeping this minimal).
- Menu/difficulty select and arcade-style initials entry are both
  dial-driven (turn to cycle, Confirm to pick) — no separate controls.
