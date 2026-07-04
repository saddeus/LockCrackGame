import type { Hint } from './types'

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

function generateMathHint(target: number): Hint {
  const template = randInt(0, 2)

  if (template === 0) {
    // X + Y = target
    const y = randInt(0, Math.min(40, target))
    const x = target - y
    return { kind: 'math', prompt: `${x} + ${y} = ?`, answer: target }
  }

  if (template === 1) {
    // X - Y = target
    const y = randInt(1, 40)
    const x = target + y
    return { kind: 'math', prompt: `${x} - ${y} = ?`, answer: target }
  }

  // (X * Y) + Z = target, with small factors so it stays readable
  const x = randInt(2, 9)
  const partial = x * randInt(1, 9)
  const y = Math.floor(partial / x)
  const z = target - partial
  return { kind: 'math', prompt: `(${x} × ${y}) + ${z} = ?`, answer: target }
}

interface ClueTemplate {
  eligible: (target: number) => boolean
  prompt: (target: number) => string
}

const CLUE_TEMPLATES: ClueTemplate[] = [
  {
    eligible: () => true,
    prompt: (t) => `Double me and take away 14, and I become ${2 * t - 14}. What number am I?`,
  },
  {
    eligible: () => true,
    prompt: (t) => `I am the number of years in ${(t / 100).toFixed(2)} centuries.`,
  },
  {
    eligible: (t) => t % 2 === 0,
    prompt: (t) => `Half of me, then add 6, makes ${t / 2 + 6}. What number am I?`,
  },
  {
    eligible: () => true,
    prompt: (t) => `I come right after ${t - 1} and right before ${t + 1}.`,
  },
]

function generateClueHint(target: number): Hint {
  const eligible = CLUE_TEMPLATES.filter((template) => template.eligible(target))
  const template = eligible[randInt(0, eligible.length - 1)]
  return { kind: 'clue', prompt: template.prompt(target), answer: target }
}

export function generateHint(target: number): Hint {
  return Math.random() < 0.5 ? generateMathHint(target) : generateClueHint(target)
}
