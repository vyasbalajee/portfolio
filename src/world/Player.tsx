import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3, type Group } from 'three'
import { nearestLandmark, resolveCollisions, type LandmarkId } from './layout'
import { readInput, type WorldState } from './state'
import Toon from './Toon'

const WALK_SPEED = 7
const RUN_SPEED = 12
const CAMERA_OFFSET = new Vector3(0, 7.5, 13)

const skin = '#f6d3b3'
const hair = '#2b2340'
const coat = '#2f3f7a'
const scarf = '#d9534f'

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
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const stride = useRef(0)
  const nearby = useRef<LandmarkId | null>(null)
  const snapCamera = useRef(true)
  const desired = useMemo(() => new Vector3(), [])
  const focus = useMemo(() => new Vector3(), [])

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
      stride.current += delta * speed * 1.5 * amount
      if (root.current) {
        root.current.rotation.y = turnTowards(root.current.rotation.y, Math.atan2(input.x, input.z), 1 - Math.exp(-14 * delta))
      }
    } else {
      stride.current = 0
    }

    const swing = moving ? Math.sin(stride.current) * 0.7 : 0
    const ease = 1 - Math.exp(-16 * delta)
    if (leftLeg.current && rightLeg.current && leftArm.current && rightArm.current && body.current) {
      leftLeg.current.rotation.x += (swing - leftLeg.current.rotation.x) * ease
      rightLeg.current.rotation.x += (-swing - rightLeg.current.rotation.x) * ease
      leftArm.current.rotation.x += (-swing * 0.8 - leftArm.current.rotation.x) * ease
      rightArm.current.rotation.x += (swing * 0.8 - rightArm.current.rotation.x) * ease
      body.current.position.y = moving ? Math.abs(Math.sin(stride.current)) * 0.12 : 0
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.6, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <group ref={body}>
        {[
          [leftLeg, -0.2],
          [rightLeg, 0.2],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<Group>} position={[x as number, 0.85, 0]}>
            <mesh castShadow position={[0, -0.4, 0]}>
              <capsuleGeometry args={[0.13, 0.5, 4, 8]} />
              <Toon color="#3a2d4f" />
            </mesh>
          </group>
        ))}
        <mesh castShadow position={[0, 1.25, 0]}>
          <capsuleGeometry args={[0.36, 0.55, 4, 12]} />
          <Toon color={coat} />
        </mesh>
        <mesh castShadow position={[0, 1.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.1, 8, 16]} />
          <Toon color={scarf} />
        </mesh>
        <mesh castShadow position={[0.12, 1.45, -0.32]} rotation={[0.5, 0, 0.2]}>
          <boxGeometry args={[0.16, 0.5, 0.06]} />
          <Toon color={scarf} />
        </mesh>
        {[
          [leftArm, -0.48],
          [rightArm, 0.48],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<Group>} position={[x as number, 1.55, 0]}>
            <mesh castShadow position={[0, -0.32, 0]}>
              <capsuleGeometry args={[0.1, 0.42, 4, 8]} />
              <Toon color={coat} />
            </mesh>
            <mesh position={[0, -0.62, 0]}>
              <sphereGeometry args={[0.1, 10, 8]} />
              <Toon color={skin} />
            </mesh>
          </group>
        ))}
        <group position={[0, 2.25, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.5, 20, 16]} />
            <Toon color={skin} />
          </mesh>
          <mesh castShadow position={[0, 0.1, -0.06]} scale={[1.08, 1, 1.08]}>
            <sphereGeometry args={[0.5, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <Toon color={hair} />
          </mesh>
          {[
            [0, 0.5, -0.1, -0.5, 0],
            [-0.28, 0.42, 0.05, -0.2, 0.6],
            [0.28, 0.42, 0.05, -0.2, -0.6],
            [-0.15, 0.4, 0.32, 0.6, 0.3],
            [0.15, 0.4, 0.32, 0.6, -0.3],
            [0, 0.25, -0.45, -1.2, 0],
          ].map(([x, y, z, rx, rz]) => (
            <mesh key={`${x}${z}`} castShadow position={[x, y, z]} rotation={[rx, 0, rz]}>
              <coneGeometry args={[0.16, 0.5, 6]} />
              <Toon color={hair} />
            </mesh>
          ))}
          {[-0.17, 0.17].map((x) => (
            <mesh key={x} position={[x, -0.02, 0.46]}>
              <boxGeometry args={[0.1, 0.18, 0.04]} />
              <meshBasicMaterial color="#1d1645" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
