# On-device top-10-per-difficulty leaderboard, stored as a single small
# JSON file on the board's flash. No cloud, no WiFi (this board doesn't
# have any) — arcade-cabinet style.
#
# Requires boot.py to have remounted storage as writable by CircuitPython
# (see boot.py) — if it hasn't (e.g. the Back button was held at power-on
# to allow editing code from a computer instead), save() will fail; that's
# surfaced to the caller via its return value rather than crashing the
# game mid-round.

import json

LEADERBOARD_PATH = "/leaderboard.json"
MAX_ENTRIES = 10
DIFFICULTIES = ("easy", "medium", "hard")


def _empty():
    return {difficulty: [] for difficulty in DIFFICULTIES}


def load():
    try:
        with open(LEADERBOARD_PATH, "r") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return _empty()
    for difficulty in DIFFICULTIES:
        data.setdefault(difficulty, [])
    return data


def save(data):
    """Returns True on success, False if the filesystem is read-only."""
    try:
        with open(LEADERBOARD_PATH, "w") as f:
            json.dump(data, f)
        return True
    except OSError:
        return False


def qualifies(data, difficulty, time_left):
    entries = data[difficulty]
    if len(entries) < MAX_ENTRIES:
        return True
    return time_left > entries[-1]["time_left"]


def add_entry(data, difficulty, initials, time_left, wrong_guesses):
    """Inserts the entry, keeps only the top MAX_ENTRIES, and saves.
    Returns True on successful save (see save())."""
    entries = data[difficulty]
    entries.append(
        {"initials": initials, "time_left": time_left, "wrong_guesses": wrong_guesses}
    )
    entries.sort(key=lambda e: e["time_left"], reverse=True)
    del entries[MAX_ENTRIES:]
    return save(data)
