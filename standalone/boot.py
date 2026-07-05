# Runs once at power-on, before code.py.
#
# By default, the board's flash is writable by a computer over USB but
# read-only to the running CircuitPython code — which means code.py can't
# save the leaderboard file. Remounting here flips that: CircuitPython
# gets write access, and the drive becomes read-only from the computer
# while the game is running.
#
# Hold the Back/Menu button while powering on to skip this and keep the
# drive writable from a computer instead, so you can edit code.py etc.

import digitalio
import storage

from pins import BUTTON_BACK

skip_remount_button = digitalio.DigitalInOut(BUTTON_BACK)
skip_remount_button.direction = digitalio.Direction.INPUT
skip_remount_button.pull = digitalio.Pull.UP

if skip_remount_button.value:  # not held down
    storage.remount("/", readonly=False)
