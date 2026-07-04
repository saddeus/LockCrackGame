import { useCallback, useEffect, useRef, useState } from 'react'
import { EncoderSerial } from '../hardware/encoderSerial'
import { DIAL_SIZE, DWELL_MS, PENALTY_SECONDS, ROUND_SECONDS, generateRound } from './combo'
import type { ComboStage, Difficulty, GameStatus } from './types'

const wrap = (value: number): number => ((value % DIAL_SIZE) + DIAL_SIZE) % DIAL_SIZE

export function useLockGame(encoder: EncoderSerial) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [stages, setStages] = useState<ComboStage[]>(() => generateRound(difficulty))
  const [stageIndex, setStageIndex] = useState(0)
  const [dialPosition, setDialPosition] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [dwelling, setDwelling] = useState(false)
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null)

  const statusRef = useRef(status)
  statusRef.current = status
  // Mirrors `stages` so confirmDigit can read the latest value without
  // needing it in its own dependency array (see note below).
  const stagesRef = useRef(stages)
  stagesRef.current = stages

  const start = useCallback((nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty)
    setStages(generateRound(nextDifficulty))
    setStageIndex(0)
    setDialPosition(0)
    setTimeLeft(ROUND_SECONDS)
    setLastResult(null)
    setStatus('playing')
  }, [])

  // Countdown timer.
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setStatus('lost')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status])

  // Deliberately excludes `stages` from its deps (reads it via stagesRef
  // instead): a wrong guess updates `stages` (wrongAttempts) without
  // moving the dial, and if confirmDigit's identity changed as a result,
  // the dwell effect below would re-arm and re-fire on every render
  // instead of once per dial position.
  const confirmDigit = useCallback(() => {
    if (statusRef.current !== 'playing') return
    const current = stagesRef.current[stageIndex]
    if (!current || current.solved) return

    if (dialPosition === current.hint.answer) {
      setLastResult('correct')
      setStages((prev) => prev.map((s, i) => (i === stageIndex ? { ...s, solved: true } : s)))
      if (stageIndex + 1 >= stagesRef.current.length) {
        setStatus('won')
      } else {
        setStageIndex(stageIndex + 1)
      }
      return
    }

    setLastResult('wrong')
    setStages((prev) =>
      prev.map((s, i) => (i === stageIndex ? { ...s, wrongAttempts: s.wrongAttempts + 1 } : s)),
    )
    setTimeLeft((t) => {
      const next = Math.max(0, t - PENALTY_SECONDS)
      if (next === 0) setStatus('lost')
      return next
    })
  }, [stageIndex, dialPosition])

  // Auto-clear the correct/wrong flash used for the dial's dwell ring.
  useEffect(() => {
    if (lastResult === null) return
    const id = setTimeout(() => setLastResult(null), 600)
    return () => clearTimeout(id)
  }, [lastResult])

  // Hardware input: the encoder has no confirm button, so this only
  // updates the dial position — confirmation is the dwell timer below.
  useEffect(() => {
    return encoder.subscribe((event) => {
      setDialPosition(wrap(event.value))
    })
  }, [encoder])

  // Dwell-time auto-confirm: once the dial has sat still for DWELL_MS,
  // attempt to confirm whatever value it's resting on.
  useEffect(() => {
    if (status !== 'playing') {
      setDwelling(false)
      return
    }
    setDwelling(true)
    const id = setTimeout(() => {
      setDwelling(false)
      confirmDigit()
    }, DWELL_MS)
    return () => clearTimeout(id)
  }, [dialPosition, status, confirmDigit])

  // Keyboard fallback for testing without hardware attached. Enter forces
  // an immediate confirm instead of waiting out the dwell timer.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setDialPosition((p) => wrap(p + 1))
      else if (e.key === 'ArrowLeft') setDialPosition((p) => wrap(p - 1))
      else if (e.key === 'Enter') confirmDigit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmDigit])

  return {
    stages,
    stageIndex,
    dialPosition,
    timeLeft,
    status,
    dwelling,
    lastResult,
    difficulty,
    start,
  }
}
