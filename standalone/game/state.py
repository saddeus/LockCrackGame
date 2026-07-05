# Game state machine for the standalone build. Plain-Python/loop-driven
# equivalent of the web version's web/src/game/useLockGame.ts — but with
# a real Confirm/Back button instead of dwell-timeout confirm, and a
# local top-10 leaderboard instead of Supabase.

import time

from game.combo import PENALTY_SECONDS, ROUND_SECONDS, generate_round

MENU_OPTIONS = ["Easy", "Medium", "Hard", "Leaderboard"]
DIFFICULTIES = ["easy", "medium", "hard"]
INITIALS_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
LED_FLASH_SECONDS = 0.3


class Game:
    def __init__(
        self, encoder, confirm_button, back_button, led_correct, led_wrong, display, sound, leaderboard
    ):
        self.encoder = encoder
        self.confirm_button = confirm_button
        self.back_button = back_button
        self.led_correct = led_correct
        self.led_wrong = led_wrong
        self.display = display
        self.sound = sound
        self.leaderboard = leaderboard

        self.state = "calibrate"
        self.menu_index = 0
        self.leaderboard_tab = 0
        self.leaderboard_data = self.leaderboard.load()

        self.difficulty = None
        self.stages = []
        self.stage_index = 0
        self.time_left = 0
        self._last_second_mark = 0.0

        self.initials = ["A", "A", "A"]
        self.initials_cursor = 0

        self._led_off_at = {}

    def start_round(self, difficulty):
        self.difficulty = difficulty
        self.stages = generate_round(difficulty)
        self.stage_index = 0
        self.time_left = ROUND_SECONDS
        self._last_second_mark = time.monotonic()
        self.state = "playing"

    def update(self):
        now = time.monotonic()
        self._update_leds(now)

        if self.state == "calibrate":
            self._update_calibrate()
        elif self.state == "menu":
            self._update_menu()
        elif self.state == "playing":
            self._update_playing(now)
        elif self.state == "won":
            self._update_won()
        elif self.state == "initials":
            self._update_initials()
        elif self.state == "lost":
            self._update_lost()
        elif self.state == "leaderboard":
            self._update_leaderboard()

    def _update_calibrate(self):
        self.display.show_calibrate()
        if self.confirm_button.update():
            self.encoder.calibrate()
            self.menu_index = 0
            self.state = "menu"

    def _update_menu(self):
        self.menu_index = self.encoder.position % len(MENU_OPTIONS)
        self.display.show_menu(MENU_OPTIONS, self.menu_index)

        if self.confirm_button.update():
            selected = MENU_OPTIONS[self.menu_index]
            if selected == "Leaderboard":
                self.leaderboard_tab = 0
                self.state = "leaderboard"
            else:
                self.start_round(selected.lower())

    def _update_playing(self, now):
        if now - self._last_second_mark >= 1.0:
            self._last_second_mark = now
            self.time_left -= 1
            if self.time_left <= 0:
                self.time_left = 0
                self.state = "lost"
                self.sound.lose()
                return

        stage = self.stages[self.stage_index]
        dial_position = self.encoder.position
        self.display.show_playing(
            self.stage_index, len(self.stages), stage.hint.prompt, dial_position, self.time_left
        )

        if self.back_button.update():
            self.state = "menu"
            return

        if self.confirm_button.update():
            if dial_position == stage.hint.answer:
                stage.solved = True
                self.sound.correct()
                self._flash_led(self.led_correct, now)
                if self.stage_index + 1 >= len(self.stages):
                    self.state = "won"
                    self.sound.win()
                else:
                    self.stage_index += 1
            else:
                stage.wrong_attempts += 1
                self.sound.wrong()
                self._flash_led(self.led_wrong, now)
                self.time_left = max(0, self.time_left - PENALTY_SECONDS)
                if self.time_left == 0:
                    self.state = "lost"
                    self.sound.lose()

    def _update_won(self):
        self.display.show_won(self.time_left)
        qualifies = self.leaderboard.qualifies(self.leaderboard_data, self.difficulty, self.time_left)

        if self.confirm_button.update() or self.back_button.update():
            if qualifies:
                self.initials = ["A", "A", "A"]
                self.initials_cursor = 0
                self.state = "initials"
            else:
                self.state = "menu"

    def _update_initials(self):
        self.display.show_initials_entry(self.initials, self.initials_cursor)
        letter_index = self.encoder.position % len(INITIALS_CHARS)
        self.initials[self.initials_cursor] = INITIALS_CHARS[letter_index]

        if self.confirm_button.update():
            self.initials_cursor += 1
            if self.initials_cursor >= 3:
                total_wrong = sum(s.wrong_attempts for s in self.stages)
                self.leaderboard.add_entry(
                    self.leaderboard_data,
                    self.difficulty,
                    "".join(self.initials),
                    self.time_left,
                    total_wrong,
                )
                self.leaderboard_tab = DIFFICULTIES.index(self.difficulty)
                self.state = "leaderboard"
        elif self.back_button.update():
            self.initials_cursor = max(0, self.initials_cursor - 1)

    def _update_lost(self):
        self.display.show_lost()
        if self.confirm_button.update() or self.back_button.update():
            self.state = "menu"

    def _update_leaderboard(self):
        difficulty = DIFFICULTIES[self.leaderboard_tab]
        self.display.show_leaderboard(difficulty, self.leaderboard_data[difficulty])

        if self.confirm_button.update():
            self.leaderboard_tab = (self.leaderboard_tab + 1) % len(DIFFICULTIES)
        if self.back_button.update():
            self.state = "menu"

    def _flash_led(self, led, now):
        led.on()
        self._led_off_at[led] = now + LED_FLASH_SECONDS

    def _update_leds(self, now):
        for led in list(self._led_off_at.keys()):
            if now >= self._led_off_at[led]:
                led.off()
                del self._led_off_at[led]
