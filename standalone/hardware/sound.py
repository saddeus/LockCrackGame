# Procedural tone-based sound effects over the board's onboard I2S amp —
# no audio asset files needed for a POC. synthio.Synthesizer can be played
# directly over I2SOut without a mixer, since there's only ever one voice.
#
# Known simplification: _tone() blocks the main loop for the tone's
# duration (each note is a time.sleep()). That's fine for these short
# (<0.5s total) cues, but if input starts feeling laggy during sound,
# this would need to become non-blocking (e.g. tick from the main loop
# instead of sleeping).

import time

import audiobusio
import board
import digitalio
import synthio

SAMPLE_RATE = 22050
NOTE_SECONDS = 0.12


class Sound:
    def __init__(self):
        # The amp sits on a gated power rail (shared with the NeoPixel
        # and servo outputs) that's off by default.
        power = digitalio.DigitalInOut(board.EXTERNAL_POWER)
        power.direction = digitalio.Direction.OUTPUT
        power.value = True

        self._i2s = audiobusio.I2SOut(board.I2S_BIT_CLOCK, board.I2S_WORD_SELECT, board.I2S_DATA)
        self._synth = synthio.Synthesizer(sample_rate=SAMPLE_RATE)
        self._i2s.play(self._synth)

    def _tone(self, frequencies):
        for freq in frequencies:
            note = synthio.Note(frequency=freq)
            self._synth.press(note)
            time.sleep(NOTE_SECONDS)
            self._synth.release(note)

    def correct(self):
        self._tone([660, 880])

    def wrong(self):
        self._tone([220, 165])

    def win(self):
        self._tone([523, 659, 784, 1047])

    def lose(self):
        self._tone([392, 330, 262])
