import { useCallback, useEffect, useRef, useState } from 'react'
import { EncoderSerial } from '../hardware/encoderSerial'
import { DIAL_SIZE, DWELL_MS, ROUND_SECONDS, generateRound } from './combo'
import type { ComboStage, GameStatus } from './types'

const wrap = (value: number): number => ((value % DIAL_SIZE) + DIAL_SIZE) % DIAL_SIZE

export function useLockGame(encoder: EncoderSerial) {
  const [stages, setStages] = useState<ComboStage[]>(() => generateRound())
  const [stageIndex, setStageIndex] = useState(0)
  const [dialPosition, setDialPosition] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [dwelling, setDwelling] = useState(false)
  const statusRef = useRef(status)
  statusRef.current = status

  const start = useCallback(() => {
    setStages(generateRound())
    setStageIndex(0)
    setDialPosition(0)
    setTimeLeft(ROUND_SECONDS)
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

  const confirmDigit = useCallback(() => {
    if (statusRef.current !== 'playing') return
    setStages((prev) => {
      const current = prev[stageIndex]
      if (!current || current.solved) return prev
      if (dialPosition !== current.hint.answer) return prev

      const next = prev.map((stage, i) => (i === stageIndex ? { ...stage, solved: true } : stage))
      if (stageIndex + 1 >= next.length) {
        setStatus('won')
      } else {
        setStageIndex(stageIndex + 1)
      }
      return next
    })
  }, [stageIndex, dialPosition])

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

  return { stages, stageIndex, dialPosition, timeLeft, status, dwelling, start }
}
