# Ported from web/src/game/hints.ts — same formulas and per-difficulty
# template pools. Uses plain "x"/"/" instead of "×"/"÷" since the OLED's
# built-in font doesn't include those Unicode glyphs.

import random

from game.types import Hint


def _add_template(target):
    y = random.randint(0, min(40, target))
    x = target - y
    return Hint("math", "{} + {} = ?".format(x, y), target)


def _subtract_template(target):
    y = random.randint(1, 40)
    x = target + y
    return Hint("math", "{} - {} = ?".format(x, y), target)


def _multiply_add_template(target):
    # (X * Y) + Z = target, with small factors so it stays readable
    x = random.randint(2, 9)
    y = random.randint(1, 9)
    z = target - x * y
    return Hint("math", "({} x {}) + {} = ?".format(x, y, z), target)


def _divide_template(target):
    y = random.randint(2, 9)
    x = target * y
    return Hint("math", "{} / {} = ?".format(x, y), target)


def _multiply_add_subtract_template(target):
    # (X * Y) + Z - W = target, one extra step over _multiply_add_template
    x = random.randint(2, 9)
    y = random.randint(1, 9)
    w = random.randint(1, 20)
    z = target - x * y + w
    return Hint("math", "({} x {}) + {} - {} = ?".format(x, y, z, w), target)


MATH_TEMPLATES = {
    "easy": [_add_template, _subtract_template],
    "medium": [_add_template, _subtract_template, _multiply_add_template],
    "hard": [_multiply_add_template, _divide_template, _multiply_add_subtract_template],
}


def _generate_math_hint(target, difficulty):
    templates = MATH_TEMPLATES[difficulty]
    template = templates[random.randint(0, len(templates) - 1)]
    return template(target)


def _neighbor_clue(t):
    return "I come right after {} and right before {}.".format(t - 1, t + 1)


def _double_clue(t):
    return "Double me and take away 14, and I become {}. What number am I?".format(2 * t - 14)


def _century_clue(t):
    return "I am the number of years in {:.2f} centuries.".format(t / 100)


def _half_clue(t):
    # t is guaranteed even by its eligibility check below, so integer
    # division here is exact (and avoids a stray ".0" from float division).
    return "Half of me, then add 6, makes {}. What number am I?".format(t // 2 + 6)


def _triple_step_clue(t):
    return "Triple me, subtract 20, then add 5, and I become {}. What number am I?".format(
        3 * t - 20 + 5
    )


def _always_eligible(t):
    return True


def _even_only(t):
    return t % 2 == 0


# (eligible, prompt) pairs — eligible() guards templates that aren't
# well-formed for every target (e.g. halving an odd number).
CLUE_TEMPLATES = {
    "easy": [(_always_eligible, _neighbor_clue)],
    "medium": [
        (_always_eligible, _neighbor_clue),
        (_always_eligible, _double_clue),
        (_always_eligible, _century_clue),
        (_even_only, _half_clue),
    ],
    "hard": [
        (_always_eligible, _double_clue),
        (_always_eligible, _century_clue),
        (_even_only, _half_clue),
        (_always_eligible, _triple_step_clue),
    ],
}


def _generate_clue_hint(target, difficulty):
    eligible = [prompt_fn for (check, prompt_fn) in CLUE_TEMPLATES[difficulty] if check(target)]
    prompt_fn = eligible[random.randint(0, len(eligible) - 1)]
    return Hint("clue", prompt_fn(target), target)


def generate_hint(target, difficulty):
    if random.random() < 0.5:
        return _generate_math_hint(target, difficulty)
    return _generate_clue_hint(target, difficulty)
