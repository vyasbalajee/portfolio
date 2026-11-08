import { useEffect, useRef } from 'react'
import { FOUNTAIN, WALL_RADIUS, arrivalPoint, landmarks, paths } from './layout'
import type { WorldState } from './state'

const VIEW = 56

// Map world coordinates to a 0–100 percentage of the map box.
const toPercent = (value: number) => ((value + VIEW) / (VIEW * 2)) * 100

export default function MiniMap({ state }: { state: WorldState }) {
  const dot = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      dot.current?.setAttribute('cx', state.position.x.toFixed(1))
      dot.current?.setAttribute('cy', state.position.z.toFixed(1))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [state])

  return (
    <nav className="world-minimap" aria-label="Map: travel to a landmark">
      <svg viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} aria-hidden="true">
        <circle r={WALL_RADIUS + 6} fill="#9cc46f" />
        <circle r={WALL_RADIUS} fill="none" stroke="#e7d7bd" strokeWidth="3" />
        {paths.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke="#ead3a8" strokeWidth="3" />
        ))}
        <circle cx={FOUNTAIN.x} cy={FOUNTAIN.z} r="4" fill="#7fc8e8" />
        <circle ref={dot} r="3.2" fill="#d9534f" stroke="#fff4dc" strokeWidth="1.5" />
      </svg>
      {landmarks.map((landmark) => (
        <button
          key={landmark.id}
          type="button"
          className="minimap-place"
          style={{ left: `${toPercent(landmark.x)}%`, top: `${toPercent(landmark.z)}%` }}
          aria-label={`Travel to ${landmark.name}`}
          title={landmark.name}
          onClick={() => {
            state.teleport = arrivalPoint(landmark)
          }}
        />
      ))}
    </nav>
  )
}
