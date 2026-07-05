# Ported from web/src/game/combo.ts. No DWELL_MS here — this build has a
# real Confirm button, so there's no dwell-timeout to configure.

import random

from game.hints import generate_hint
from game.types import ComboStage

DIAL_SIZE = 100
STAGE_COUNT = 3
ROUND_SECONDS = 180

# Time docked from the clock for a wrong confirm, to make guess-and-check
# spinning through every number a losing strategy.
PENALTY_SECONDS = 15


def generate_round(difficulty):
    stages = []
    for _ in range(STAGE_COUNT):
        target = random.randint(0, DIAL_SIZE - 1)
        stages.append(ComboStage(generate_hint(target, difficulty)))
    return stages
