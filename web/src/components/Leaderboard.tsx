import { Fragment, useEffect, useState } from 'react'
import type { Difficulty } from '../game/types'
import { fetchScores } from '../leaderboard/api'
import type { ScoreEntry } from '../leaderboard/types'

interface LeaderboardProps {
  onBack: () => void
}

const TABS: Difficulty[] = ['easy', 'medium', 'hard']

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setExpandedIndex(null)
    fetchScores(difficulty)
      .then((data) => {
        if (cancelled) return
        setScores(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [difficulty])

  return (
    <div className="leaderboard">
      <div className="leaderboard-tabs">
        {TABS.map((d) => (
          <button
            key={d}
            className={d === difficulty ? 'leaderboard-tab active' : 'leaderboard-tab'}
            onClick={() => setDifficulty(d)}
          >
            {d[0].toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p className="leaderboard-error">{error}</p>}
      {status === 'ready' && scores.length === 0 && <p>No scores yet — be the first!</p>}

      {status === 'ready' && scores.length > 0 && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Who</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, i) => (
              <Fragment key={score.id ?? i}>
                <tr
                  className="leaderboard-row"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  <td>{i + 1}</td>
                  <td>{score.initials}</td>
                  <td>{formatTime(score.time_left)}</td>
                  <td>{formatDate(score.created_at)}</td>
                </tr>
                {expandedIndex === i && (
                  <tr className="leaderboard-detail-row">
                    <td colSpan={4}>
                      <ul className="leaderboard-detail-list">
                        {score.stages.map((stage, si) => (
                          <li key={si}>
                            <span className="leaderboard-detail-kind">[{stage.kind}]</span>{' '}
                            {stage.prompt} — answer {stage.answer}
                            {stage.wrongAttempts > 0 && (
                              <span className="leaderboard-detail-wrong">
                                {' '}
                                ({stage.wrongAttempts} wrong attempt
                                {stage.wrongAttempts === 1 ? '' : 's'})
                              </span>
                            )}
                          </li>
                        ))}
                        <li>Wrong guesses total: {score.wrong_guesses}</li>
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      <button className="leaderboard-back" onClick={onBack}>
        Back to menu
      </button>
    </div>
  )
}
