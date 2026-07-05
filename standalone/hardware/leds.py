# Thin wrapper over a single GPIO-driven LED. "Briefly flash" timing is
# the caller's job (game/state.py) — this is just an on/off pin.

import digitalio


class Led:
    def __init__(self, pin):
        self._pin = digitalio.DigitalInOut(pin)
        self._pin.direction = digitalio.Direction.OUTPUT
        self._pin.value = False

    def on(self):
        self._pin.value = True

    def off(self):
        self._pin.value = False
