# Debounced, edge-detected momentary button (active low, internal
# pull-up) — same debounce pattern the web version's ItsyBitsy firmware
# used before the encoder's confirm button was dropped for dwell-confirm.

import time

import digitalio

DEBOUNCE_SECONDS = 0.03


class Button:
    def __init__(self, pin):
        self._pin = digitalio.DigitalInOut(pin)
        self._pin.direction = digitalio.Direction.INPUT
        self._pin.pull = digitalio.Pull.UP
        self._pressed = False
        self._last_change = 0.0

    def update(self):
        """Call once per loop iteration. Returns True exactly once per
        physical press (the moment it transitions to pressed)."""
        now = time.monotonic()
        pressed = not self._pin.value
        if pressed != self._pressed and (now - self._last_change) > DEBOUNCE_SECONDS:
            self._last_change = now
            self._pressed = pressed
            return pressed
        return False
