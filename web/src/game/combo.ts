import { generateHint } from './hints'
import type { ComboStage, Difficulty } from './types'

export const DIAL_SIZE = 100
export const STAGE_COUNT = 3
export const ROUND_SECONDS = 180

// How long the dial must sit still before a digit auto-confirms. This
// encoder has no physical confirm button, so "confirm" is a dwell timeout.
export const DWELL_MS = 1000

// Time docked from the clock for a wrong dwell-confirm, to make
// guess-and-check spinning through every number a losing strategy.
export const PENALTY_SECONDS = 15

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

export function generateRound(difficulty: Difficulty): ComboStage[] {
  return Array.from({ length: STAGE_COUNT }, () => {
    const target = randInt(0, DIAL_SIZE - 1)
    return { hint: generateHint(target, difficulty), solved: false, wrongAttempts: 0 }
  })
}
