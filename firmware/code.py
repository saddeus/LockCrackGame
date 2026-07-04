# Lock Crack Game — ItsyBitsy firmware
#
# Reads a 100-detent CNC rotary encoder (quadrature A/B + push button) and
# streams dial state to the browser over USB serial (CircuitPython console).
#
# Line protocol (one event per line):
#   POS:<0-99>\n   absolute dial position, sent whenever it changes
#   BTN:1\n        push-button press (confirm current digit)
#
# Wiring:
#   Encoder A      -> board.A1
#   Encoder B      -> board.A2
#   Encoder common -> GND
#   Button pin     -> board.A3
#   Button common  -> GND
#
# Most CNC rotary encoders are open-collector and need a pull-up to the
# board's logic voltage; this firmware enables the internal pull-ups on all
# three pins, so no external resistors are required for most modules. If
# your encoder is 5V-only/open-collector and readings look noisy, add
# external 10k pull-ups to 3.3V instead of relying on the internal ones.

import time

import board
import digitalio
import rotaryio

# This encoder reports 4 quadrature counts per detent (standard for
# incremental encoders read via rotaryio). Adjust if yours differs.
COUNTS_PER_DETENT = 4
DIAL_SIZE = 100
DEBOUNCE_SECONDS = 0.03

encoder = rotaryio.IncrementalEncoder(board.A1, board.A2)

button = digitalio.DigitalInOut(board.A3)
button.direction = digitalio.Direction.INPUT
button.pull = digitalio.Pull.UP

last_position = None
button_was_pressed = False
last_button_change = 0.0

while True:
    now = time.monotonic()

    raw = encoder.position // COUNTS_PER_DETENT
    position = raw % DIAL_SIZE
    if position != last_position:
        last_position = position
        print("POS:{}".format(position))

    pressed = not button.value
    if pressed != button_was_pressed and (now - last_button_change) > DEBOUNCE_SECONDS:
        last_button_change = now
        button_was_pressed = pressed
        if pressed:
            print("BTN:1")

    time.sleep(0.005)
