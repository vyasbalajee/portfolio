import { Html, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { LoopOnce, LoopRepeat, type Group } from 'three'
import { FOUNTAIN, npcs, type Npc, type NpcId } from './layout'
import { HERO_ANIMATIONS, toonify, useModel } from './models'
import type { WorldState } from './state'

const LOOK_RANGE = 9

function Townsperson({ npc, state, talking }: { npc: Npc; state: WorldState; talking: boolean }) {
  const { scene } = useModel(`/models/npc-${npc.model}.glb`)
  const { animations } = useModel(HERO_ANIMATIONS)
  const root = useRef<Group>(null)
  const { actions } = useAnimations(animations, root)
  const restingAngle = useMemo(() => Math.atan2(FOUNTAIN.x - npc.x, FOUNTAIN.z - npc.z), [npc])

  useMemo(() => toonify(scene), [scene])

  useEffect(() => {
    actions.Idle_A?.reset().setLoop(LoopRepeat, Infinity).play()
  }, [actions])

  // Wave when a conversation starts, then settle back into idling.
  useEffect(() => {
    const wave = actions.Interact
    const idle = actions.Idle_A
    if (!talking || !wave || !idle) return
    wave.reset().setLoop(LoopOnce, 1).fadeIn(0.2).play()
    wave.clampWhenFinished = false
    idle.fadeOut(0.2)
    const back = setTimeout(() => {
      idle.reset().fadeIn(0.3).play()
      wave.fadeOut(0.3)
    }, (wave.getClip().duration - 0.3) * 1000)
    return () => clearTimeout(back)
  }, [talking, actions])

  // Turn to face the hero while they're nearby.
  useFrame((_, delta) => {
    if (!root.current) return
    const dx = state.position.x - npc.x
    const dz = state.position.z - npc.z
    const target = Math.hypot(dx, dz) < LOOK_RANGE ? Math.atan2(dx, dz) : restingAngle
    const current = root.current.rotation.y
    root.current.rotation.y = current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * (1 - Math.exp(-5 * delta))
  })

  return (
    <group ref={root} position={[npc.x, 0, npc.z]} rotation={[0, restingAngle, 0]}>
      <primitive object={scene} scale={1.15} />
      <Html position={[0, 3.2, 0]} center zIndexRange={[5, 0]}>
        <span className="world-label world-label-npc">{npc.name}</span>
      </Html>
    </group>
  )
}

export default function Npcs({ state, talkingTo }: { state: WorldState; talkingTo: NpcId | null }) {
  return (
    <>
      {npcs.map((npc) => (
        <Townsperson key={npc.id} npc={npc} state={state} talking={talkingTo === npc.id} />
      ))}
    </>
  )
}
