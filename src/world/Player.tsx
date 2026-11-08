import { useAnimations } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { LoopRepeat, Vector3, type Group } from 'three'
import { nearestLandmark, resolveCollisions, type LandmarkId } from './layout'
import { HERO, HERO_ANIMATIONS, toonify, useModel } from './models'
import { readInput, type WorldState } from './state'

const WALK_SPEED = 7
const RUN_SPEED = 12
const CAMERA_OFFSET = new Vector3(0, 9.5, 13)
const HERO_SCALE = 1.2

type Motion = 'Idle_A' | 'Walking_A' | 'Running_A'

function turnTowards(current: number, target: number, amount: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + difference * amount
}

type Props = {
  state: WorldState
  onNearby: (id: LandmarkId | null) => void
}

export default function Player({ state, onNearby }: Props) {
  const camera = useThree((three) => three.camera)
  const { scene } = useModel(HERO)
  const { animations } = useModel(HERO_ANIMATIONS)
  const root = useRef<Group>(null)
  const { actions } = useAnimations(animations, root)
  const motion = useRef<Motion | null>(null)
  const nearby = useRef<LandmarkId | null>(null)
  const snapCamera = useRef(true)
  const desired = useMemo(() => new Vector3(), [])
  const focus = useMemo(() => new Vector3(), [])

  useMemo(() => toonify(scene), [scene])

  const play = (next: Motion) => {
    if (motion.current === next) return
    const action = actions[next]
    if (!action) return
    action.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.2).play()
    if (motion.current) actions[motion.current]?.fadeOut(0.2)
    motion.current = next
  }

  // Start idling as soon as the clips are bound.
  useEffect(() => play('Idle_A'), [actions])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const position = state.position

    if (state.teleport) {
      position.set(state.teleport.x, 0, state.teleport.z)
      state.teleport = null
      snapCamera.current = true
    }

    const input = state.paused ? { x: 0, z: 0 } : readInput(state)
    const amount = Math.hypot(input.x, input.z)
    const moving = amount > 0.05

    if (moving) {
      const speed = state.run ? RUN_SPEED : WALK_SPEED
      position.x += input.x * speed * delta
      position.z += input.z * speed * delta
      resolveCollisions(position)
      if (root.current) {
        root.current.rotation.y = turnTowards(root.current.rotation.y, Math.atan2(input.x, input.z), 1 - Math.exp(-14 * delta))
      }
      play(state.run ? 'Running_A' : 'Walking_A')
    } else {
      play('Idle_A')
    }
    root.current?.position.set(position.x, 0, position.z)

    desired.copy(position).add(CAMERA_OFFSET)
    camera.position.lerp(desired, snapCamera.current ? 1 : 1 - Math.exp(-4 * delta))
    snapCamera.current = false
    camera.lookAt(focus.set(position.x, 2.6, position.z - 6))

    const found = nearestLandmark(position)?.id ?? null
    if (found !== nearby.current) {
      nearby.current = found
      onNearby(found)
    }
  })

  return (
    <group ref={root}>
      <primitive object={scene} scale={HERO_SCALE} />
    </group>
  )
}
