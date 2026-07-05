# Drives the 1.3" 128x64 SSD1306 OLED (#938) over the board's onboard
# STEMMA QT I2C connector.
#
# Screen budget: terminalio's built-in font is 6x8px, so this display fits
# ~21 characters per line and ~7 lines total. The longest hint prompt
# across every difficulty/target (verified against game/hints.py's actual
# templates) wraps to 4 lines at that width, so show_playing budgets for
# 4. The leaderboard shows as many of the top 10 as fit rather than
# scrolling — a deliberate simplification to keep this compact, matching
# the "like an old arcade" ask.

import board
import displayio
import terminalio
from adafruit_display_text import label

import adafruit_displayio_ssd1306

WIDTH = 128
HEIGHT = 64
CHARS_PER_LINE = 21
I2C_ADDRESS = 0x3C


def _wrap_text(text, max_chars_per_line):
    words = text.split(" ")
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else current + " " + word
        if len(candidate) > max_chars_per_line:
            if current:
                lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


class Display:
    def __init__(self):
        displayio.release_displays()
        i2c = board.STEMMA_I2C()
        bus = displayio.I2CDisplay(i2c, device_address=I2C_ADDRESS)
        self._display = adafruit_displayio_ssd1306.SSD1306(bus, width=WIDTH, height=HEIGHT)
        self._group = displayio.Group()
        # .root_group replaces the older display.show(group) API.
        self._display.root_group = self._group

    def _clear(self):
        while len(self._group) > 0:
            self._group.pop()

    def _line(self, text, y):
        self._group.append(label.Label(terminalio.FONT, text=text, x=0, y=y))

    def show_calibrate(self):
        self._clear()
        self._line("CALIBRATE", 6)
        self._line("Turn dial to top", 24)
        self._line("notch, then press", 36)
        self._line("Confirm", 48)

    def show_menu(self, options, selected_index):
        self._clear()
        self._line("LOCK CRACK", 6)
        for i, option in enumerate(options):
            prefix = "> " if i == selected_index else "  "
            self._line(prefix + option, 20 + i * 12)

    def show_playing(self, stage_index, stage_count, prompt, dial_position, time_left):
        # Longest real prompt across every difficulty/target wraps to 4
        # lines at CHARS_PER_LINE (verified against every template) — so
        # this budgets 4 lines, not 3, or the tail of long riddles would
        # get cut off.
        self._clear()
        self._line("Stg {}/{}  {}s".format(stage_index + 1, stage_count, time_left), 6)
        for i, line in enumerate(_wrap_text(prompt, CHARS_PER_LINE)[:4]):
            self._line(line, 16 + i * 9)
        self._line("Dial: {:02d}".format(dial_position), 58)

    def show_won(self, time_left):
        self._clear()
        self._line("CRACKED IT!", 20)
        self._line("Score: {}s".format(time_left), 34)

    def show_lost(self):
        self._clear()
        self._line("TIME'S UP", 24)

    def show_initials_entry(self, initials, cursor_index):
        self._clear()
        self._line("NEW HIGH SCORE!", 6)
        self._line("Enter initials:", 20)
        chars = []
        for i, ch in enumerate(initials):
            chars.append("[{}]".format(ch) if i == cursor_index else " {} ".format(ch))
        self._line("".join(chars), 40)

    def show_leaderboard(self, difficulty, entries):
        self._clear()
        self._line(difficulty.upper() + " TOP 10", 6)
        # Only ~6 rows fit at 64px tall — show as many as fit rather than
        # add scrolling for a top-10 list.
        for i, entry in enumerate(entries[:6]):
            self._line(
                "{}.{} {}s".format(i + 1, entry["initials"], entry["time_left"]), 16 + i * 8
            )
