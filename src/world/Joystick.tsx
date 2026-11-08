import { useRef, type PointerEvent } from 'react'
import type { WorldState } from './state'

export default function Joystick({ state }: { state: WorldState }) {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const pointer = useRef<number | null>(null)

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!base.current || !knob.current) return
    const { left, top, width, height } = base.current.getBoundingClientRect()
    let x = (event.clientX - left - width / 2) / (width / 2)
    let z = (event.clientY - top - height / 2) / (height / 2)
    const length = Math.hypot(x, z)
    if (length > 1) {
      x /= length
      z /= length
    }
    state.stick = { x, z }
    knob.current.style.transform = `translate(${x * 34}px, ${z * 34}px)`
  }

  const release = () => {
    pointer.current = null
    state.stick = { x: 0, z: 0 }
    if (knob.current) knob.current.style.transform = ''
  }

  return (
    <div
      ref={base}
      className="joystick"
      role="presentation"
      onPointerDown={(event) => {
        pointer.current = event.pointerId
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // Capture is a nicety; dragging still works without it.
        }
        move(event)
      }}
      onPointerMove={(event) => {
        if (event.pointerId === pointer.current) move(event)
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knob} className="joystick-knob" />
    </div>
  )
}
