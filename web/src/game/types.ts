export type HintKind = 'math' | 'clue'

export interface Hint {
  kind: HintKind
  prompt: string
  /** The dial number (0-99) this hint resolves to. */
  answer: number
}

export interface ComboStage {
  hint: Hint
  solved: boolean
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'
