# Lock Crack firmware

CircuitPython firmware for the Adafruit ItsyBitsy, reading a 100-stop CNC
rotary encoder and streaming dial state to the browser over USB serial.

## Setup

1. Flash CircuitPython onto the ItsyBitsy (adafruit.com/circuitpython, pick
   your exact ItsyBitsy variant — M0, M4, or nRF52840).
2. Wire the encoder per the comment block at the top of `code.py`.
3. Copy `code.py` onto the `CIRCUITPY` drive that appears once CircuitPython
   is flashed (it auto-runs on save/reset).
4. No extra libraries needed — this uses only the built-in `board`,
   `digitalio`, and `rotaryio` modules.

## Protocol

One line per event over the USB serial console, 115200 baud:

```
POS:<0-99>\n   dial position changed
BTN:1\n        push button pressed
```

The `web/` app's `src/hardware/encoderSerial.ts` speaks this protocol via
WebSerial.

## Tuning

`COUNTS_PER_DETENT` in `code.py` assumes a standard quadrature encoder that
reports 4 counts per detent. If the dial in the browser moves more than one
number per physical click (or doesn't move a full step), adjust that
constant to match your specific encoder.
