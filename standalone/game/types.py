# Ported from web/src/game/types.ts — plain classes rather than
# dataclasses, for the widest CircuitPython version compatibility.

# Difficulty is just one of the strings "easy" | "medium" | "hard" — no
# enum, to keep this lightweight on a microcontroller.


class Hint:
    def __init__(self, kind, prompt, answer):
        self.kind = kind  # "math" | "clue"
        self.prompt = prompt
        self.answer = answer  # the dial number (0-99) this hint resolves to


class ComboStage:
    def __init__(self, hint):
        self.hint = hint
        self.solved = False
        self.wrong_attempts = 0
