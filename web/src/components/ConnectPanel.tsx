import { useState } from 'react'
import { EncoderSerial } from '../hardware/encoderSerial'

interface ConnectPanelProps {
  encoder: EncoderSerial
}

export function ConnectPanel({ encoder }: ConnectPanelProps) {
  const [connected, setConnected] = useState(encoder.connected)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    setError(null)
    try {
      await encoder.connect()
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const disconnect = async () => {
    await encoder.disconnect()
    setConnected(false)
  }

  if (!EncoderSerial.isSupported) {
    return (
      <div className="connect-panel connect-panel-warning">
        WebSerial isn't supported in this browser — use Chrome or Edge to connect the physical
        dial. Arrow keys + Enter still work for testing.
      </div>
    )
  }

  return (
    <div className="connect-panel">
      <button onClick={connected ? disconnect : connect}>
        {connected ? 'Disconnect dial' : 'Connect dial'}
      </button>
      {error && <span className="connect-error">{error}</span>}
    </div>
  )
}
