import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'

const COUNT = 80

// Easter egg: paper lanterns drifting up over the city.
export default function Lanterns({ active }: { active: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const lanterns = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: Math.cos(i * 2.39996) * (6 + (i % 9) * 4.5),
        z: Math.sin(i * 2.39996) * (6 + (i % 9) * 4.5),
        y: -(i % 20) * 3,
        speed: 1.6 + (i % 5) * 0.35,
        sway: i * 0.7,
      })),
    [],
  )
  const matrix = useMemo(() => new Matrix4(), [])
  const position = useMemo(() => new Vector3(), [])
  const rotation = useMemo(() => new Quaternion(), [])
  const scale = useMemo(() => new Vector3(1, 1, 1), [])

  useLayoutEffect(() => {
    if (!active) lanterns.forEach((l, i) => (l.y = -(i % 20) * 3))
  }, [active, lanterns])

  useFrame(({ clock }, delta) => {
    if (!active || !mesh.current) return
    lanterns.forEach((l, i) => {
      l.y += l.speed * delta
      if (l.y > 70) l.y = 0
      position.set(l.x + Math.sin(clock.elapsedTime * 0.6 + l.sway) * 0.8, Math.max(l.y, 0) + 2, l.z)
      scale.setScalar(l.y < 0 ? 0 : 1)
      mesh.current!.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} visible={active} frustumCulled={false}>
      <cylinderGeometry args={[0.35, 0.28, 0.7, 8]} />
      <meshBasicMaterial color="#ffb347" />
    </instancedMesh>
  )
}
