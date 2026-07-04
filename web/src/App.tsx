import { useState } from 'react'
import { ConnectPanel } from './components/ConnectPanel'
import { Dial } from './components/Dial'
import { DifficultySelect } from './components/DifficultySelect'
import { HintPanel } from './components/HintPanel'
import { InitialsEntry } from './components/InitialsEntry'
import { Leaderboard } from './components/Leaderboard'
import { EncoderSerial } from './hardware/encoderSerial'
import { useLockGame } from './game/useLockGame'
import { submitScore } from './leaderboard/api'
import './App.css'

type View = 'menu' | 'game' | 'leaderboard'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function App() {
  const [encoder] = useState(() => new EncoderSerial())
  const {
    stages,
    stageIndex,
    dialPosition,
    timeLeft,
    status,
    dwelling,
    lastResult,
    difficulty,
    start,
  } = useLockGame(encoder)

  const [view, setView] = useState<View>('menu')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSelectDifficulty = (nextDifficulty: typeof difficulty) => {
    start(nextDifficulty)
    setSubmitted(false)
    setSubmitError(null)
    setView('game')
  }

  const handleSubmitScore = async (initials: string) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitScore({
        difficulty,
        initials,
        time_left: timeLeft,
        wrong_guesses: stages.reduce((sum, s) => sum + s.wrongAttempts, 0),
        stages: stages.map((s) => ({
          prompt: s.hint.prompt,
          kind: s.hint.kind,
          answer: s.hint.answer,
          wrongAttempts: s.wrongAttempts,
        })),
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lock Crack</h1>
        <ConnectPanel encoder={encoder} />
      </header>

      {view === 'menu' && (
        <main>
          <DifficultySelect onSelect={handleSelectDifficulty} />
          <div className="menu-nav">
            <button onClick={() => setView('leaderboard')}>View leaderboard</button>
          </div>
        </main>
      )}

      {view === 'leaderboard' && (
        <main>
          <Leaderboard onBack={() => setView('menu')} />
        </main>
      )}

      {view === 'game' && (
        <>
          <main className="app-main">
            <Dial position={dialPosition} dwelling={dwelling} lastResult={lastResult} />

            <div className="side-panel">
              <div className="timer" data-low={timeLeft <= 30}>
                {formatTime(timeLeft)}
              </div>
              <HintPanel stages={stages} stageIndex={stageIndex} />

              {status === 'won' && !submitted && (
                <InitialsEntry
                  timeLeft={timeLeft}
                  onSubmit={handleSubmitScore}
                  submitting={submitting}
                  error={submitError}
                />
              )}

              {status === 'won' && submitted && (
                <div className="status-panel">
                  <p className="status-won">Cracked it! 🔓 Score saved.</p>
                  <button onClick={() => setView('menu')}>Play again</button>
                  <button onClick={() => setView('leaderboard')}>View leaderboard</button>
                </div>
              )}

              {status === 'lost' && (
                <div className="status-panel">
                  <p className="status-lost">Time's up. 🔒</p>
                  <button onClick={() => setView('menu')}>Back to menu</button>
                </div>
              )}
            </div>
          </main>

          <footer className="app-footer">
            <p>
              Turn the dial and hold still to confirm a digit, or use ← → (and Enter to confirm
              instantly) for testing without hardware. A wrong guess costs you time.
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
