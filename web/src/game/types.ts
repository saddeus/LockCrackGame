export type HintKind = 'math' | 'clue'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Hint {
  kind: HintKind
  prompt: string
  /** The dial number (0-99) this hint resolves to. */
  answer: number
}

export interface ComboStage {
  hint: Hint
  solved: boolean
  wrongAttempts: number
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'
