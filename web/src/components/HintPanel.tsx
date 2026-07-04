import type { ComboStage } from '../game/types'

interface HintPanelProps {
  stages: ComboStage[]
  stageIndex: number
}

export function HintPanel({ stages, stageIndex }: HintPanelProps) {
  return (
    <div className="hint-panel">
      <h2>Stage {stageIndex + 1} / {stages.length}</h2>
      <ol className="hint-list">
        {stages.map((stage, i) => (
          <li key={i} className={stage.solved ? 'hint-solved' : i === stageIndex ? 'hint-active' : 'hint-pending'}>
            {stage.solved ? (
              <span>✓ Cracked: {stage.hint.answer}</span>
            ) : i === stageIndex ? (
              <span>[{stage.hint.kind}] {stage.hint.prompt}</span>
            ) : (
              <span>Locked</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
