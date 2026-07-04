import type { Difficulty, Hint } from './types'

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

interface MathTemplate {
  eligible: (target: number) => boolean
  build: (target: number) => Hint
}

const ADD_TEMPLATE: MathTemplate = {
  eligible: () => true,
  build: (target) => {
    const y = randInt(0, Math.min(40, target))
    const x = target - y
    return { kind: 'math', prompt: `${x} + ${y} = ?`, answer: target }
  },
}

const SUBTRACT_TEMPLATE: MathTemplate = {
  eligible: () => true,
  build: (target) => {
    const y = randInt(1, 40)
    const x = target + y
    return { kind: 'math', prompt: `${x} - ${y} = ?`, answer: target }
  },
}

const MULTIPLY_ADD_TEMPLATE: MathTemplate = {
  // (X * Y) + Z = target, with small factors so it stays readable
  eligible: () => true,
  build: (target) => {
    const x = randInt(2, 9)
    const y = randInt(1, 9)
    const z = target - x * y
    return { kind: 'math', prompt: `(${x} × ${y}) + ${z} = ?`, answer: target }
  },
}

const DIVIDE_TEMPLATE: MathTemplate = {
  eligible: () => true,
  build: (target) => {
    const y = randInt(2, 9)
    const x = target * y
    return { kind: 'math', prompt: `${x} ÷ ${y} = ?`, answer: target }
  },
}

const MULTIPLY_ADD_SUBTRACT_TEMPLATE: MathTemplate = {
  // (X * Y) + Z - W = target, one extra step over MULTIPLY_ADD_TEMPLATE
  eligible: () => true,
  build: (target) => {
    const x = randInt(2, 9)
    const y = randInt(1, 9)
    const w = randInt(1, 20)
    const z = target - x * y + w
    return { kind: 'math', prompt: `(${x} × ${y}) + ${z} - ${w} = ?`, answer: target }
  },
}

const MATH_TEMPLATES: Record<Difficulty, MathTemplate[]> = {
  easy: [ADD_TEMPLATE, SUBTRACT_TEMPLATE],
  medium: [ADD_TEMPLATE, SUBTRACT_TEMPLATE, MULTIPLY_ADD_TEMPLATE],
  hard: [MULTIPLY_ADD_TEMPLATE, DIVIDE_TEMPLATE, MULTIPLY_ADD_SUBTRACT_TEMPLATE],
}

function generateMathHint(target: number, difficulty: Difficulty): Hint {
  const pool = MATH_TEMPLATES[difficulty].filter((t) => t.eligible(target))
  const template = pool[randInt(0, pool.length - 1)]
  return template.build(target)
}

interface ClueTemplate {
  eligible: (target: number) => boolean
  prompt: (target: number) => string
}

const NEIGHBOR_CLUE: ClueTemplate = {
  eligible: () => true,
  prompt: (t) => `I come right after ${t - 1} and right before ${t + 1}.`,
}

const DOUBLE_CLUE: ClueTemplate = {
  eligible: () => true,
  prompt: (t) => `Double me and take away 14, and I become ${2 * t - 14}. What number am I?`,
}

const CENTURY_CLUE: ClueTemplate = {
  eligible: () => true,
  prompt: (t) => `I am the number of years in ${(t / 100).toFixed(2)} centuries.`,
}

const HALF_CLUE: ClueTemplate = {
  eligible: (t) => t % 2 === 0,
  prompt: (t) => `Half of me, then add 6, makes ${t / 2 + 6}. What number am I?`,
}

const TRIPLE_STEP_CLUE: ClueTemplate = {
  eligible: () => true,
  prompt: (t) => `Triple me, subtract 20, then add 5, and I become ${3 * t - 20 + 5}. What number am I?`,
}

const CLUE_TEMPLATES: Record<Difficulty, ClueTemplate[]> = {
  easy: [NEIGHBOR_CLUE],
  medium: [NEIGHBOR_CLUE, DOUBLE_CLUE, CENTURY_CLUE, HALF_CLUE],
  hard: [DOUBLE_CLUE, CENTURY_CLUE, HALF_CLUE, TRIPLE_STEP_CLUE],
}

function generateClueHint(target: number, difficulty: Difficulty): Hint {
  const pool = CLUE_TEMPLATES[difficulty].filter((t) => t.eligible(target))
  const template = pool[randInt(0, pool.length - 1)]
  return { kind: 'clue', prompt: template.prompt(target), answer: target }
}

export function generateHint(target: number, difficulty: Difficulty): Hint {
  return Math.random() < 0.5
    ? generateMathHint(target, difficulty)
    : generateClueHint(target, difficulty)
}
