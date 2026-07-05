# Wraps rotaryio.IncrementalEncoder with the same tuned COUNTS_PER_DETENT
# as the web version's firmware/code.py (this specific encoder reports 1
# raw count per detent, not the "standard" 4), plus a calibration offset
# since the encoder has no idea where its physical top notch is.

import rotaryio

from game.combo import DIAL_SIZE

COUNTS_PER_DETENT = 1


def _wrap(value):
    return value % DIAL_SIZE


class Encoder:
    def __init__(self, pin_a, pin_b):
        self._encoder = rotaryio.IncrementalEncoder(pin_a, pin_b)
        self._offset = 0

    def calibrate(self):
        """Call while the knob is at its physical top notch — makes that
        position report as dial position 0 from now on."""
        self._offset = self._raw_position()

    def _raw_position(self):
        return self._encoder.position // COUNTS_PER_DETENT

    @property
    def position(self):
        return _wrap(self._raw_position() - self._offset)
