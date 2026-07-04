import { useCallback, useEffect, useRef, useState } from 'react'
import { EncoderSerial } from '../hardware/encoderSerial'
import { DIAL_SIZE, ROUND_SECONDS, generateRound } from './combo'
import type { ComboStage, GameStatus } from './types'

const wrap = (value: number): number => ((value % DIAL_SIZE) + DIAL_SIZE) % DIAL_SIZE

export function useLockGame(encoder: EncoderSerial) {
  const [stages, setStages] = useState<ComboStage[]>(() => generateRound())
  const [stageIndex, setStageIndex] = useState(0)
  const [dialPosition, setDialPosition] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [status, setStatus] = useState<GameStatus>('idle')
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

  // Hardware input: dial position + confirm button.
  useEffect(() => {
    return encoder.subscribe((event) => {
      if (event.type === 'position') {
        setDialPosition(wrap(event.value))
      } else if (event.type === 'button') {
        confirmDigit()
      }
    })
  }, [encoder, confirmDigit])

  // Keyboard fallback for testing without hardware attached.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setDialPosition((p) => wrap(p + 1))
      else if (e.key === 'ArrowLeft') setDialPosition((p) => wrap(p - 1))
      else if (e.key === 'Enter') confirmDigit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmDigit])

  return { stages, stageIndex, dialPosition, timeLeft, status, start }
}
