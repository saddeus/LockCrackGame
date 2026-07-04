import { useState } from 'react'
import type { FormEvent } from 'react'

interface InitialsEntryProps {
  timeLeft: number
  onSubmit: (initials: string) => void
  submitting: boolean
  error: string | null
}

export function InitialsEntry({ timeLeft, onSubmit, submitting, error }: InitialsEntryProps) {
  const [initials, setInitials] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (initials.length !== 3) return
    onSubmit(initials)
  }

  return (
    <form className="initials-entry" onSubmit={handleSubmit}>
      <p className="initials-score">Score: {timeLeft}s left</p>
      <label htmlFor="initials-input">Enter your initials</label>
      <input
        id="initials-input"
        className="initials-input"
        value={initials}
        onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={3}
        autoFocus
        disabled={submitting}
      />
      <button type="submit" disabled={initials.length !== 3 || submitting}>
        {submitting ? 'Saving…' : 'Submit score'}
      </button>
      {error && <p className="initials-error">{error}</p>}
    </form>
  )
}
