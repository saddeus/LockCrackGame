# Lock Crack Game — ItsyBitsy firmware
#
# Reads a 100-detent CNC rotary encoder (Adafruit #5734) and streams dial
# position to the browser over USB serial (CircuitPython console).
#
# Line protocol (one event per line):
#   POS:<0-99>\n   absolute dial position, sent whenever it changes
#
# Wiring (see firmware/README.md for the full breadboard walkthrough):
#   Encoder VCC -> ItsyBitsy 3V
#   Encoder GND -> ItsyBitsy GND
#   Encoder A   -> ItsyBitsy A1
#   Encoder B   -> ItsyBitsy A2
#
# This encoder has its own pull-up resistors referenced to its VCC terminal,
# so powering VCC from the ItsyBitsy's 3V pin makes A/B idle at 3.3V and
# pulse low — directly compatible with the board's logic inputs. No
# external pull-ups or a confirm button are needed; "confirm" is handled in
# the web app as a dwell-time timeout once the dial stops moving.

import time

import board
import rotaryio

# This encoder reports 4 quadrature counts per detent (standard for
# incremental encoders read via rotaryio). Adjust if yours differs.
COUNTS_PER_DETENT = 4
DIAL_SIZE = 100

encoder = rotaryio.IncrementalEncoder(board.A1, board.A2)

last_position = None

while True:
    raw = encoder.position // COUNTS_PER_DETENT
    position = raw % DIAL_SIZE
    if position != last_position:
        last_position = position
        print("POS:{}".format(position))

    time.sleep(0.005)
