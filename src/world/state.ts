import { Vector3 } from 'three'
import { SPAWN, type Point } from './layout'

// Mutable state shared between the DOM controls and the render loop, so per-frame
// updates never go through React.
export type WorldState = {
  position: Vector3
  teleport: Point | null
  keys: Set<string>
  stick: Point
  run: boolean
  paused: boolean
}

export function createWorldState(): WorldState {
  return {
    position: new Vector3(SPAWN.x, 0, SPAWN.z),
    teleport: null,
    keys: new Set(),
    stick: { x: 0, z: 0 },
    run: false,
    paused: false,
  }
}

const left = ['KeyA', 'ArrowLeft']
const right = ['KeyD', 'ArrowRight']
const up = ['KeyW', 'ArrowUp']
const down = ['KeyS', 'ArrowDown']

export const movementKeys = new Set([...left, ...right, ...up, ...down])

export function readInput(state: WorldState): Point {
  const pressed = (codes: string[]) => (codes.some((code) => state.keys.has(code)) ? 1 : 0)
  let x = pressed(right) - pressed(left) + state.stick.x
  let z = pressed(down) - pressed(up) + state.stick.z
  const length = Math.hypot(x, z)
  if (length > 1) {
    x /= length
    z /= length
  }
  return { x, z }
}
