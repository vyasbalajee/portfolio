// Original ambient music, generated live with the Web Audio API: slow pad chords under a
// sparse pentatonic melody with a soft echo. Nothing is downloaded.

const ROOT = 146.83 // D3
const semitone = (n: number) => ROOT * 2 ** (n / 12)

// D major pentatonic for the melody; I - vi - IV - V for the pads.
const melody = [12, 14, 16, 19, 21, 24, 26, 28]
const chords = [
  [0, 4, 7, 11],
  [-3, 0, 4, 7],
  [-7, -3, 0, 4],
  [-5, -1, 2, 7],
]
const CHORD_SECONDS = 8

export class AmbientMusic {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private echo: GainNode | null = null
  private timers: number[] = []

  start() {
    if (this.context) return
    const context = new AudioContext()
    const master = context.createGain()
    master.gain.value = 0
    master.gain.linearRampToValueAtTime(0.18, context.currentTime + 3)
    master.connect(context.destination)

    // A feedback delay gives the melody a gentle echo.
    const delay = context.createDelay()
    delay.delayTime.value = 0.45
    const feedback = context.createGain()
    feedback.gain.value = 0.35
    const echo = context.createGain()
    echo.gain.value = 0.5
    echo.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(master)

    this.context = context
    this.master = master
    this.echo = echo

    let chord = 0
    const playChord = () => {
      this.pad(chords[chord % chords.length])
      chord++
    }
    playChord()
    this.timers.push(window.setInterval(playChord, CHORD_SECONDS * 1000))

    const playNote = () => {
      if (Math.random() < 0.75) this.pluck(melody[Math.floor(Math.random() * melody.length)])
      this.timers.push(window.setTimeout(playNote, 600 + Math.random() * 900))
    }
    playNote()
  }

  stop() {
    this.timers.forEach((id) => {
      clearInterval(id)
      clearTimeout(id)
    })
    this.timers = []
    const context = this.context
    if (!context || !this.master) return
    this.master.gain.cancelScheduledValues(context.currentTime)
    this.master.gain.setValueAtTime(this.master.gain.value, context.currentTime)
    this.master.gain.linearRampToValueAtTime(0, context.currentTime + 0.8)
    window.setTimeout(() => void context.close(), 900)
    this.context = null
    this.master = null
    this.echo = null
  }

  private pad(notes: number[]) {
    const context = this.context!
    const now = context.currentTime
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 2.5)
    gain.gain.linearRampToValueAtTime(0, now + CHORD_SECONDS + 1.5)
    filter.connect(gain)
    gain.connect(this.master!)
    for (const note of notes) {
      for (const detune of [-6, 6]) {
        const osc = context.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = semitone(note)
        osc.detune.value = detune
        osc.connect(filter)
        osc.start(now)
        osc.stop(now + CHORD_SECONDS + 1.6)
      }
    }
  }

  private pluck(note: number) {
    const context = this.context!
    const now = context.currentTime
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = semitone(note)
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    osc.connect(gain)
    gain.connect(this.master!)
    gain.connect(this.echo!)
    osc.start(now)
    osc.stop(now + 1.9)
  }
}
