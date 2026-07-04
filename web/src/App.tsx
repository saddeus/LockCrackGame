import { useState } from 'react'
import { ConnectPanel } from './components/ConnectPanel'
import { Dial } from './components/Dial'
import { HintPanel } from './components/HintPanel'
import { EncoderSerial } from './hardware/encoderSerial'
import { useLockGame } from './game/useLockGame'
import './App.css'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function App() {
  const [encoder] = useState(() => new EncoderSerial())
  const { stages, stageIndex, dialPosition, timeLeft, status, start } = useLockGame(encoder)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lock Crack</h1>
        <ConnectPanel encoder={encoder} />
      </header>

      <main className="app-main">
        <Dial position={dialPosition} />

        <div className="side-panel">
          <div className="timer" data-low={timeLeft <= 30}>
            {formatTime(timeLeft)}
          </div>
          <HintPanel stages={stages} stageIndex={stageIndex} />

          {status !== 'playing' && (
            <div className="status-panel">
              {status === 'won' && <p className="status-won">Cracked it! 🔓</p>}
              {status === 'lost' && <p className="status-lost">Time's up. 🔒</p>}
              <button onClick={start}>{status === 'idle' ? 'Start' : 'Play again'}</button>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Turn the dial with the physical encoder, or use ← → and Enter for testing.</p>
      </footer>
    </div>
  )
}

export default App
