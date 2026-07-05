# Entry point — runs automatically on power-up/reset.

import time

import leaderboard
import pins
from game.state import Game
from hardware.buttons import Button
from hardware.display import Display
from hardware.encoder import Encoder
from hardware.leds import Led
from hardware.sound import Sound

encoder = Encoder(pins.ENCODER_A, pins.ENCODER_B)
confirm_button = Button(pins.BUTTON_CONFIRM)
back_button = Button(pins.BUTTON_BACK)
led_correct = Led(pins.LED_CORRECT)
led_wrong = Led(pins.LED_WRONG)
display = Display()
sound = Sound()

game = Game(
    encoder, confirm_button, back_button, led_correct, led_wrong, display, sound, leaderboard
)

while True:
    game.update()
    time.sleep(0.02)
