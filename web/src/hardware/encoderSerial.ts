// Bridges the WebSerial API to the ItsyBitsy's line protocol.
//
// Firmware protocol (see firmware/code.py), one line per event over USB CDC:
//   POS:<0-99>\n   absolute dial position, sent whenever it changes
//
// There's no physical confirm button on this encoder — "confirm" is a
// dwell-time timeout handled in web/src/game/useLockGame.ts once the dial
// stops moving.

export type EncoderEvent = { type: 'position'; value: number }

export type EncoderListener = (event: EncoderEvent) => void

const BAUD_RATE = 115200

export class EncoderSerial {
  private port: SerialPort | null = null
  private reader: ReadableStreamDefaultReader<string> | null = null
  private readLoopPromise: Promise<void> | null = null
  private listeners = new Set<EncoderListener>()

  get connected(): boolean {
    return this.port !== null
  }

  static get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator
  }

  subscribe(listener: EncoderListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async connect(): Promise<void> {
    if (!EncoderSerial.isSupported) {
      throw new Error('WebSerial is not supported in this browser (use Chrome or Edge).')
    }
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: BAUD_RATE })
    this.port = port
    this.readLoopPromise = this.readLoop(port)
  }

  async disconnect(): Promise<void> {
    await this.reader?.cancel().catch(() => {})
    await this.readLoopPromise?.catch(() => {})
    await this.port?.close().catch(() => {})
    this.port = null
    this.reader = null
    this.readLoopPromise = null
  }

  private async readLoop(port: SerialPort): Promise<void> {
    if (!port.readable) return
    const textStream = port.readable.pipeThrough(
      new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>,
    )
    const reader = textStream.getReader()
    this.reader = reader

    let buffer = ''
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        let newlineIndex: number
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          this.handleLine(line)
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private handleLine(line: string): void {
    if (!line) return
    const [key, rawValue] = line.split(':')
    if (key === 'POS' && rawValue !== undefined) {
      const value = Number.parseInt(rawValue, 10)
      if (Number.isFinite(value)) {
        this.emit({ type: 'position', value })
      }
    }
  }

  private emit(event: EncoderEvent): void {
    for (const listener of this.listeners) listener(event)
  }
}
