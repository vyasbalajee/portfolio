import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChat } from '../chat/Chat'
import { profile } from '../content'
import Environment, { localTimeOfDay, type TimeOfDay } from './Environment'
import Joystick from './Joystick'
import Landmarks from './Landmarks'
import Lanterns from './Lanterns'
import { SPAWN, landmarks, npcs, type Landmark, type Npc, type NpcId, type TargetId } from './layout'
import MiniMap from './MiniMap'
import { Nature, Village } from './models'
import { AmbientMusic } from './music'
import Npcs from './Npcs'
import Player from './Player'
import { createWorldState, movementKeys } from './state'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

function LoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active && progress === 100) return null
  return (
    <div className="world-loading world-loading-overlay" role="status">
      Raising the kingdom… {Math.round(progress)}%
    </div>
  )
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

type Panel =
  | { kind: 'landmark'; landmark: Landmark }
  | { kind: 'npc'; npc: Npc; line: number }
  | { kind: 'fountain'; message: string }

type TimeMode = 'local' | TimeOfDay
const timeModes: TimeMode[] = ['local', 'day', 'golden', 'night']
const timeLabels: Record<TimeOfDay, string> = { day: 'Day', golden: 'Golden hour', night: 'Night' }

const wishes = [
  'The coin sinks with a soft glimmer. Your wish is heard.',
  'The water ripples gold. The fountain seems to be listening…',
]
const SECRETS = 2
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

function targetName(id: TargetId) {
  if (id === 'fountain') return 'Toss a coin in the fountain'
  if (id.startsWith('npc:')) return `Talk to ${npcs.find((n) => `npc:${n.id}` === id)!.name.toLowerCase()}`
  return `Enter ${landmarks.find((l) => l.id === id)!.name}`
}

export default function World() {
  const [state] = useState(createWorldState)
  const [supported] = useState(hasWebGL)
  const [nearby, setNearby] = useState<TargetId | null>(null)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [timeMode, setTimeMode] = useState<TimeMode>('local')
  const [localTime, setLocalTime] = useState(localTimeOfDay)
  const [musicOn, setMusicOn] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [secrets, setSecrets] = useState<Set<string>>(new Set())
  const [talkedTo, setTalkedTo] = useState<Set<NpcId>>(new Set())
  const coins = useRef(0)
  const nearbyRef = useRef<TargetId | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const music = useRef<AmbientMusic | null>(null)
  const konami = useRef<string[]>([])
  const touch = useMediaQuery('(pointer: coarse)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const chat = useChat()

  const time = timeMode === 'local' ? localTime : timeMode
  const lanterns = secrets.has('lanterns')

  const announce = useCallback((message: string) => setToast(message), [])

  const discover = useCallback(
    (secret: string, message: string) => {
      setSecrets((found) => {
        if (found.has(secret)) return found
        const next = new Set(found).add(secret)
        announce(`${message} Secrets found: ${next.size} of ${SECRETS}.`)
        return next
      })
    },
    [announce],
  )

  const handleNearby = useCallback((id: TargetId | null) => {
    nearbyRef.current = id
    setNearby(id)
  }, [])

  const interact = useCallback(
    (id: TargetId | null) => {
      if (!id) return
      if (id === 'fountain') {
        coins.current += 1
        if (coins.current >= 3) {
          state.blessed = true
          setPanel({ kind: 'fountain', message: 'The fountain glows! Swift golden boots are yours. Run with Shift to feel them.' })
          discover('blessing', "You earned the fountain's blessing.")
        } else {
          setPanel({ kind: 'fountain', message: wishes[coins.current - 1] })
        }
        return
      }
      if (id.startsWith('npc:')) {
        const npc = npcs.find((n) => `npc:${n.id}` === id)!
        setTalkedTo((talked) => new Set(talked).add(npc.id))
        setPanel({ kind: 'npc', npc, line: 0 })
        return
      }
      setPanel({ kind: 'landmark', landmark: landmarks.find((l) => l.id === id)! })
    },
    [state, discover],
  )

  useEffect(() => {
    document.title = `Sky kingdom | ${profile.name}`
  }, [])

  // Follow the visitor's clock.
  useEffect(() => {
    const timer = window.setInterval(() => setLocalTime(localTimeOfDay()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (talkedTo.size === npcs.length) discover('lanterns', 'Everyone in town is your friend now. The lantern festival begins!')
  }, [talkedTo, discover])

  useEffect(() => () => music.current?.stop(), [])

  useEffect(() => {
    state.paused = panel !== null
    if (panel) {
      state.stick = { x: 0, z: 0 }
      closeButton.current?.focus()
    }
  }, [panel, state])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      konami.current = [...konami.current, event.code].slice(-KONAMI.length)
      if (konami.current.join() === KONAMI.join()) discover('lanterns', 'A secret code! The lantern festival begins!')

      if (panel) {
        if (event.code === 'Escape') setPanel(null)
        return
      }
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea')) return
      if (movementKeys.has(event.code)) {
        event.preventDefault()
        state.keys.add(event.code)
      }
      if (event.key === 'Shift') state.run = true
      if (event.code === 'KeyE' || event.code === 'Enter') interact(nearbyRef.current)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      state.keys.delete(event.code)
      if (event.key === 'Shift') state.run = false
    }
    const reset = () => {
      state.keys.clear()
      state.run = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', reset)
    }
  }, [panel, interact, discover, state])

  const toggleMusic = () => {
    if (musicOn) {
      music.current?.stop()
      music.current = null
    } else {
      music.current = new AmbientMusic()
      music.current.start()
    }
    setMusicOn(!musicOn)
  }

  const cycleTime = () => setTimeMode(timeModes[(timeModes.indexOf(timeMode) + 1) % timeModes.length])

  if (!supported) {
    return (
      <section className="world world-fallback">
        <h1>The kingdom needs WebGL</h1>
        <p>Your browser can't show the 3D world, but everything in it is on the main site.</p>
        <Link className="button button-primary" to="/">
          Go to the quick view
        </Link>
      </section>
    )
  }

  const talkingTo = panel?.kind === 'npc' ? panel.npc.id : null

  return (
    <section className={`world world-${time}`} aria-label="Explorable sky kingdom">
      <Canvas
        flat
        shadows={!touch}
        dpr={touch ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !touch }}
        camera={{ fov: 50, near: 0.5, far: 900, position: [SPAWN.x, 9.5, SPAWN.z + 13] }}
      >
        <Suspense fallback={null}>
          <Environment shadows={!touch} time={time} />
          <Landmarks animate={!reducedMotion} />
          <Village />
          <Nature />
          <Npcs state={state} talkingTo={talkingTo} />
          <Lanterns active={lanterns} />
          <Player state={state} onNearby={handleNearby} />
        </Suspense>
      </Canvas>
      <LoadingOverlay />

      <div className="world-hud">
        <h1>The sky kingdom</h1>
        <p className="world-controls">
          {touch ? (
            'Drag the joystick to walk. Tap a landmark on the map to travel.'
          ) : (
            <>
              <kbd>WASD</kbd> or arrow keys to walk, <kbd>Shift</kbd> to run, <kbd>E</kbd> to interact. Click the map to
              travel.
            </>
          )}
        </p>
        <div className="world-toggles">
          <button type="button" onClick={cycleTime}>
            Time: {timeMode === 'local' ? `Your clock (${timeLabels[localTime]})` : timeLabels[timeMode]}
          </button>
          <button type="button" onClick={toggleMusic} aria-pressed={musicOn}>
            Music: {musicOn ? 'On' : 'Off'}
          </button>
        </div>
        <p className="world-secrets">
          Secrets found: {secrets.size} of {SECRETS}
        </p>
        <Link to="/">Skip the tour</Link>
        <p className="world-credits">Models by Kay Lousberg, Kenney and Quaternius (CC0).</p>
      </div>

      <MiniMap state={state} />

      {toast && (
        <p className="world-toast" role="status">
          {toast}
        </p>
      )}

      {nearby && !panel && (
        <button type="button" className="world-prompt" onClick={() => interact(nearby)}>
          {!touch && <kbd>E</kbd>} {targetName(nearby)}
        </button>
      )}

      {panel && (
        <div className="world-panel" role="dialog" aria-modal="false" aria-labelledby="world-panel-title">
          {panel.kind === 'landmark' && (
            <>
              <h2 id="world-panel-title">{panel.landmark.name}</h2>
              <p>{panel.landmark.blurb}</p>
              <div className="actions">
                <Link className="button button-primary" to={panel.landmark.href}>
                  {panel.landmark.cta}
                </Link>
                <button ref={closeButton} type="button" className="button" onClick={() => setPanel(null)}>
                  Keep exploring
                </button>
              </div>
            </>
          )}
          {panel.kind === 'npc' && (
            <>
              <h2 id="world-panel-title">{panel.npc.name}</h2>
              <p>{panel.npc.lines[panel.line]}</p>
              <div className="actions">
                {panel.npc.opensChat ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      setPanel(null)
                      chat.open(panel.npc.lines[0])
                    }}
                  >
                    Ask the sage
                  </button>
                ) : (
                  panel.line < panel.npc.lines.length - 1 && (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => setPanel({ ...panel, line: panel.line + 1 })}
                    >
                      Go on
                    </button>
                  )
                )}
                <button ref={closeButton} type="button" className="button" onClick={() => setPanel(null)}>
                  Farewell
                </button>
              </div>
            </>
          )}
          {panel.kind === 'fountain' && (
            <>
              <h2 id="world-panel-title">The fountain</h2>
              <p>{panel.message}</p>
              <div className="actions">
                <button ref={closeButton} type="button" className="button" onClick={() => setPanel(null)}>
                  Keep exploring
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {touch && !panel && <Joystick state={state} />}
    </section>
  )
}
