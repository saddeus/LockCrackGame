import type { Difficulty } from '../game/types'

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void
}

const DIFFICULTIES: { value: Difficulty; label: string; blurb: string }[] = [
  { value: 'easy', label: 'Easy', blurb: 'Addition & subtraction only' },
  { value: 'medium', label: 'Medium', blurb: 'Adds multiplication & riddles' },
  { value: 'hard', label: 'Hard', blurb: 'Multi-step math & tougher riddles' },
]

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="difficulty-select">
      <h2>Choose a difficulty</h2>
      <div className="difficulty-options">
        {DIFFICULTIES.map((d) => (
          <button key={d.value} className="difficulty-option" onClick={() => onSelect(d.value)}>
            <span className="difficulty-label">{d.label}</span>
            <span className="difficulty-blurb">{d.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
