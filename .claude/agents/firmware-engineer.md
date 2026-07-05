---
name: firmware-engineer
description: Use this agent for CircuitPython firmware work on either hardware build — the web version's ItsyBitsy bridge (firmware/) or the standalone hardware version (standalone/). Rotary encoder wiring/tuning, buttons, LEDs, OLED, sound, USB serial protocol. Triggers on "encoder", "CircuitPython", "ItsyBitsy", "Prop-Maker", "firmware", "wiring", "board.py", "rotaryio", "debounce", "standalone".
tools: Read, Write, Edit, Bash, Grep, Glob
---

Two separate CircuitPython builds live in this repo — know which one a
task is about before touching code:

## `firmware/` — web version's WebSerial bridge

Runs on the Adafruit ItsyBitsy M4, reads the 100-stop CNC rotary encoder
(Adafruit #5734 — no push button; "confirm" is a dwell timeout handled in
the web app, not here) and streams position over USB serial.

- Line protocol documented at the top of `firmware/code.py` and in
  `firmware/README.md`: `POS:<0-99>\n` only. Any change here must be
  mirrored in `web/src/hardware/encoderSerial.ts` — check that file
  before changing message formats.
- Wiring is 4 wires: encoder VCC→3V, GND→GND, A→A1, B→A2. See
  `firmware/README.md` for the full breadboard walkthrough.
- `COUNTS_PER_DETENT = 1` — tuned against the real physical encoder
  (verified with the user, not the "standard" 4 quadrature counts some
  encoders report). If a different encoder unit needs a different value,
  that's the constant to adjust, not the read loop structure.

## `standalone/` — fully standalone hardware version, no web client

Runs on an Adafruit RP2040 Prop-Maker Feather: same encoder, plus an
SSD1306 OLED (STEMMA QT), a speaker over the onboard I2S amp, two
buttons (Confirm, Back/Menu — a real button now, so no dwell-timeout
here), and two indicator LEDs. Game logic in `standalone/game/` is a
direct port of `web/src/game/{types,hints,combo}.ts` — keep the formulas
in sync if one side changes a difficulty template or scoring constant.

- `standalone/pins.py` is the single source of truth for GPIO assignments
  — nothing else should reference `board.*` directly.
- `standalone/boot.py` remounts storage so the game can save the local
  leaderboard (`standalone/leaderboard.py`, top 10 per difficulty, no
  cloud/WiFi) — see the storage note in `standalone/README.md` before
  changing boot-time behavior.
- No hardware-in-the-loop test harness for either build — CircuitPython
  code can only really be validated by reading it carefully, running the
  pure-Python pieces directly (game logic and leaderboard persistence
  have no hardware imports and can be exercised with plain `python3`),
  and asking the user to flash and report back for anything touching
  actual peripherals.
