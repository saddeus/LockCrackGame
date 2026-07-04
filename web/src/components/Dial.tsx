import { DIAL_SIZE, DWELL_MS } from '../game/combo'

interface DialProps {
  position: number
  dwelling: boolean
}

const DWELL_RING_CIRCUMFERENCE = 2 * Math.PI * 95

export function Dial({ position, dwelling }: DialProps) {
  const angle = (position / DIAL_SIZE) * 360
  const ticks = Array.from({ length: DIAL_SIZE }, (_, i) => i)

  return (
    <div className="dial">
      <svg viewBox="0 0 200 200" className="dial-face">
        <circle cx="100" cy="100" r="95" className="dial-ring" />
        {dwelling && (
          <circle
            key={position}
            cx="100"
            cy="100"
            r="95"
            className="dial-dwell-ring"
            strokeDasharray={DWELL_RING_CIRCUMFERENCE}
            style={{ animationDuration: `${DWELL_MS}ms` }}
          />
        )}
        {ticks.map((i) => {
          const tickAngle = (i / DIAL_SIZE) * 360
          const major = i % 10 === 0
          const r1 = major ? 78 : 84
          const rad = (tickAngle * Math.PI) / 180
          const x1 = 100 + r1 * Math.sin(rad)
          const y1 = 100 - r1 * Math.cos(rad)
          const x2 = 100 + 90 * Math.sin(rad)
          const y2 = 100 - 90 * Math.cos(rad)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={major ? 'dial-tick-major' : 'dial-tick-minor'}
            />
          )
        })}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}>
          <line x1="100" y1="100" x2="100" y2="20" className="dial-pointer" />
        </g>
        <circle cx="100" cy="100" r="6" className="dial-hub" />
      </svg>
      <div className="dial-readout">{position.toString().padStart(2, '0')}</div>
    </div>
  )
}
