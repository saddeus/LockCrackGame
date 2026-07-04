# Lock Crack firmware

CircuitPython firmware for the Adafruit ItsyBitsy M4, reading a 100-stop
CNC rotary encoder and streaming dial position to the browser over USB
serial.

## Parts

- Adafruit ItsyBitsy M4 Express
- [CNC Rotary Encoder, 100 Pulses/Rotation, 60mm](https://www.adafruit.com/product/5734)
  — 6 screw terminals on the back: **VCC**, **GND**, **A**, **B**, and two
  unlabeled mechanical mounting terminals (not electrical — leave them
  disconnected).
- Half-size breadboard (e.g. [Adafruit #4539](https://www.adafruit.com/product/4539))
- 4 male-to-male jumper wires
- A short length of hookup wire or jumper wires long enough to reach the
  screw terminals on the encoder (it doesn't sit on the breadboard itself —
  it's hand-sized and panel-mounted, so its 4 wires run to the breadboard)

This encoder has no push button — see "Confirm without a button" below.

## Breadboard wiring

1. **Seat the ItsyBitsy on the breadboard.** With headers soldered on, place
   it straddling the center gap so its two rows of pins land in separate
   column groups (the same way you'd seat a Feather or Metro Mini — this
   breadboard's spacing is sized for that). Leave a few rows free on both
   ends so you can still see each pin's silkscreen label.
2. **Run 4 wires from the encoder's screw terminals to the breadboard**,
   into the same columns as these ItsyBitsy pins:
   - Encoder **VCC** → column wired to ItsyBitsy **3V**
   - Encoder **GND** → column wired to ItsyBitsy **GND**
   - Encoder **A** → column wired to ItsyBitsy **A1**
   - Encoder **B** → column wired to ItsyBitsy **A2**
3. That's it — 4 connections. No resistors needed: this encoder has its own
   pull-up resistors referenced to its VCC terminal, so powering VCC from
   the ItsyBitsy's `3V` pin makes A/B idle at 3.3V and pulse low, which is
   directly compatible with the ItsyBitsy's 3.3V logic inputs.
4. Plug the ItsyBitsy into your computer over USB (for power and the
   serial connection the web app reads from).

Double-check VCC is going to `3V`, not `USB`/`BAT` (5V) — the encoder says
it accepts "any DC voltage," but 5V logic on the A/B lines would be out of
spec for the ItsyBitsy's 3.3V-only GPIO pins.

## Confirm without a button

This encoder is rotation-only, so there's no physical "confirm" input.
Instead, the web app treats a **dwell timeout** as confirm: once the dial
sits still for about a second (`DWELL_MS` in `web/src/game/combo.ts`),
whatever value it's resting on is checked against the current stage's
target. The firmware doesn't need to know about this — it just reports
position changes.

## Software setup

1. Flash CircuitPython onto the ItsyBitsy M4
   (circuitpython.org/board/itsybitsy_m4_express/).
2. Copy `code.py` onto the `CIRCUITPY` drive that appears once
   CircuitPython is flashed (it auto-runs on save/reset).
3. No extra libraries needed — this uses only the built-in `board` and
   `rotaryio` modules.

## Protocol

One line per event over the USB serial console, 115200 baud:

```
POS:<0-99>\n   dial position changed
```

The `web/` app's `src/hardware/encoderSerial.ts` speaks this protocol via
WebSerial.

## Tuning

`COUNTS_PER_DETENT` in `code.py` assumes a standard quadrature encoder that
reports 4 counts per detent. If the dial in the browser moves more than one
number per physical click (or doesn't move a full step), adjust that
constant to match your specific encoder — turn the dial exactly one click
and check how much `encoder.position` (raw, before dividing) changes in
the CircuitPython REPL.
