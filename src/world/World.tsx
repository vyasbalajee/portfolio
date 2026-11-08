import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { profile } from '../content'
import Environment from './Environment'
import Joystick from './Joystick'
import Landmarks from './Landmarks'
import { SPAWN, landmarks, type Landmark, type LandmarkId } from './layout'
import MiniMap from './MiniMap'
import { Nature, Village } from './models'
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

export default function World() {
  const [state] = useState(createWorldState)
  const [supported] = useState(hasWebGL)
  const [nearby, setNearby] = useState<LandmarkId | null>(null)
  const [open, setOpen] = useState<Landmark | null>(null)
  const nearbyRef = useRef<LandmarkId | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const touch = useMediaQuery('(pointer: coarse)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const nearbyLandmark = landmarks.find((l) => l.id === nearby) ?? null

  const handleNearby = useCallback((id: LandmarkId | null) => {
    nearbyRef.current = id
    setNearby(id)
  }, [])

  const enter = useCallback(() => {
    const landmark = landmarks.find((l) => l.id === nearbyRef.current)
    if (landmark) setOpen(landmark)
  }, [])

  useEffect(() => {
    document.title = `Sky kingdom | ${profile.name}`
  }, [])

  useEffect(() => {
    state.paused = open !== null
    if (open) {
      state.stick = { x: 0, z: 0 }
      closeButton.current?.focus()
    }
  }, [open, state])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (open) {
        if (event.code === 'Escape') setOpen(null)
        return
      }
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea')) return
      if (movementKeys.has(event.code)) {
        event.preventDefault()
        state.keys.add(event.code)
      }
      if (event.key === 'Shift') state.run = true
      if (event.code === 'KeyE' || event.code === 'Enter') enter()
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
  }, [open, enter, state])

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

  return (
    <section className="world" aria-label="Explorable sky kingdom">
      <Canvas
        flat
        shadows={!touch}
        dpr={touch ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !touch }}
        camera={{ fov: 50, near: 0.5, far: 900, position: [SPAWN.x, 9.5, SPAWN.z + 13] }}
      >
        <Suspense fallback={null}>
          <Environment shadows={!touch} />
          <Landmarks animate={!reducedMotion} />
          <Village />
          <Nature />
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
              <kbd>WASD</kbd> or arrow keys to walk, <kbd>Shift</kbd> to run, <kbd>E</kbd> to enter. Click the map to
              travel.
            </>
          )}
        </p>
        <Link to="/">Skip the tour</Link>
        <p className="world-credits">Models by Kay Lousberg, Kenney and Quaternius (CC0).</p>
      </div>

      <MiniMap state={state} />

      {nearbyLandmark && !open && (
        <button type="button" className="world-prompt" onClick={() => setOpen(nearbyLandmark)}>
          {!touch && <kbd>E</kbd>} Enter {nearbyLandmark.name}
        </button>
      )}

      {open && (
        <div className="world-panel" role="dialog" aria-modal="false" aria-labelledby="world-panel-title">
          <h2 id="world-panel-title">{open.name}</h2>
          <p>{open.blurb}</p>
          <div className="actions">
            <Link className="button button-primary" to={open.href}>
              {open.cta}
            </Link>
            <button ref={closeButton} type="button" className="button" onClick={() => setOpen(null)}>
              Keep exploring
            </button>
          </div>
        </div>
      )}

      {touch && !open && <Joystick state={state} />}
    </section>
  )
}
