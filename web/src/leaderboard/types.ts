import type { Difficulty, HintKind } from '../game/types'

// Mirrors the `scores` table columns directly (snake_case) rather than
// adding a camelCase mapping layer — see firmware/README.md-style docs in
// CLAUDE.md for the schema.
export interface StageDetail {
  prompt: string
  kind: HintKind
  answer: number
  wrongAttempts: number
}

export interface ScoreEntry {
  id?: number
  created_at?: string
  difficulty: Difficulty
  initials: string
  time_left: number
  wrong_guesses: number
  stages: StageDetail[]
}
