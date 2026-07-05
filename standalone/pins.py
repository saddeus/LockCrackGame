# Central pin assignments for the standalone build (Adafruit RP2040
# Prop-Maker Feather). Change these here if you wire it up differently —
# nothing else in this codebase should reference board.* pins directly.

import board

# CNC Rotary Encoder (#5734): VCC -> 3V, GND -> GND, A/B below.
ENCODER_A = board.A0
ENCODER_B = board.A1

# Momentary buttons, wired to GND (internal pull-up, active low).
BUTTON_CONFIRM = board.A2
BUTTON_BACK = board.A3

# Indicator LEDs, each through a ~330 ohm resistor to GND.
LED_CORRECT = board.D5
LED_WRONG = board.D6
