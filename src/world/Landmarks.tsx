import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { LatheGeometry, Vector2, type Mesh } from 'three'
import { FOUNTAIN, landmarks, type Landmark, type LandmarkId } from './layout'
import Toon from './Toon'

const stone = '#efe1c6'
const roofRed = '#d9534f'
const glow = '#ffd27a'

function Keep() {
  const corners: [number, number][] = [
    [-6, -4.5],
    [6, -4.5],
    [-6, 4.5],
    [6, 4.5],
  ]
  return (
    <>
      <mesh castShadow receiveShadow position={[0, 4, 0]}>
        <boxGeometry args={[12, 8, 9]} />
        <Toon color={stone} />
      </mesh>
      {corners.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 5.5, 0]}>
            <cylinderGeometry args={[1.6, 1.7, 11, 16]} />
            <Toon color={stone} />
          </mesh>
          <mesh castShadow position={[0, 12.7, 0]}>
            <coneGeometry args={[2.1, 3.4, 16]} />
            <Toon color={roofRed} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 9, 0]}>
        <cylinderGeometry args={[2.6, 2.8, 18, 20]} />
        <Toon color={stone} />
      </mesh>
      <mesh castShadow position={[0, 21, 0]}>
        <coneGeometry args={[3.3, 6, 20]} />
        <Toon color={roofRed} />
      </mesh>
      <mesh position={[0, 25.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 6]} />
        <Toon color="#5b3d4f" />
      </mesh>
      <mesh position={[0.7, 25.8, 0]}>
        <boxGeometry args={[1.4, 0.8, 0.05]} />
        <Toon color="#f5b942" />
      </mesh>
      <mesh position={[0, 1.9, 4.52]}>
        <boxGeometry args={[2.4, 3.8, 0.05]} />
        <Toon color="#5b3d4f" />
      </mesh>
      {[-3.5, 3.5].map((x) => (
        <mesh key={x} position={[x, 5.5, 4.52]}>
          <boxGeometry args={[1, 1.4, 0.05]} />
          <meshBasicMaterial color={glow} />
        </mesh>
      ))}
    </>
  )
}

function Academy() {
  return (
    <>
      <mesh castShadow position={[0, 8, 0]}>
        <cylinderGeometry args={[2.4, 2.7, 16, 16]} />
        <Toon color="#e9dcc4" />
      </mesh>
      <mesh castShadow position={[0, 17, 0]}>
        <boxGeometry args={[3.6, 2.2, 3.6]} />
        <Toon color="#e9dcc4" />
      </mesh>
      <mesh position={[0, 17, 1.82]}>
        <boxGeometry args={[1.4, 1.4, 0.05]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh castShadow position={[0, 19.8, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3, 3.4, 4]} />
        <Toon color="#4b6fb5" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2, 3]}>
        <boxGeometry args={[6, 4, 3.6]} />
        <Toon color="#e9dcc4" />
      </mesh>
      <mesh castShadow position={[0, 4.6, 3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.3, 1.3, 6.2, 3]} />
        <Toon color="#4b6fb5" />
      </mesh>
      <mesh position={[0, 1.4, 4.82]}>
        <boxGeometry args={[1.6, 2.8, 0.05]} />
        <Toon color="#3a2d4f" />
      </mesh>
    </>
  )
}

function Archive() {
  const columns = [-4, -2.4, -0.8, 0.8, 2.4, 4]
  return (
    <>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[12, 0.8, 8.4]} />
        <Toon color="#d9c7b0" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 3.4, -0.8]}>
        <boxGeometry args={[11, 5.2, 6]} />
        <Toon color="#f1e6d2" />
      </mesh>
      {columns.map((x) => (
        <mesh key={x} castShadow position={[x, 3.2, 3.4]}>
          <cylinderGeometry args={[0.32, 0.36, 4.8, 12]} />
          <Toon color="#f6efe2" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 6.2, 1.2]}>
        <boxGeometry args={[11.6, 0.8, 5.6]} />
        <Toon color="#e4d3b8" />
      </mesh>
      <mesh castShadow position={[0, 7.4, -0.6]}>
        <cylinderGeometry args={[3.4, 3.6, 1.6, 24]} />
        <Toon color="#f1e6d2" />
      </mesh>
      <mesh castShadow position={[0, 8.2, -0.6]}>
        <sphereGeometry args={[3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Toon color="#4fb3a5" />
      </mesh>
      <mesh position={[0, 2.4, 2.22]}>
        <boxGeometry args={[2, 3.2, 0.05]} />
        <Toon color="#3a2d4f" />
      </mesh>
    </>
  )
}

function lathe(points: [number, number][]) {
  return new LatheGeometry(
    points.map(([x, y]) => new Vector2(x, y)),
    24,
  )
}

function Citadel() {
  const king = useMemo(
    () =>
      lathe([
        [0, 0],
        [1.6, 0],
        [1.6, 0.5],
        [1.1, 0.9],
        [0.75, 2.4],
        [0.65, 4.6],
        [1.2, 5],
        [0.85, 5.4],
        [1.05, 6.6],
        [0.6, 7.2],
        [0, 7.4],
      ]),
    [],
  )
  const rook = useMemo(
    () =>
      lathe([
        [0, 0],
        [1.5, 0],
        [1.5, 0.5],
        [1, 1],
        [0.9, 3.4],
        [1.3, 3.8],
        [1.3, 5],
        [0, 5],
      ]),
    [],
  )
  const tiles = useMemo(() => {
    const list: { x: number; z: number; dark: boolean }[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        list.push({ x: (col - 3.5) * 1.3, z: (row - 3.5) * 1.3, dark: (row + col) % 2 === 1 })
      }
    }
    return list
  }, [])

  return (
    <>
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[11, 0.12, 11]} />
        <Toon color="#7a5a6e" />
      </mesh>
      {tiles.map(({ x, z, dark }) => (
        <mesh key={`${x}${z}`} receiveShadow position={[x, 0.14, z]}>
          <boxGeometry args={[1.3, 0.06, 1.3]} />
          <Toon color={dark ? '#3a2d4f' : '#f5ecd9'} />
        </mesh>
      ))}
      <group position={[-1, 0.16, -1]} scale={1.25}>
        <mesh castShadow geometry={king}>
          <Toon color="#f5ecd9" />
        </mesh>
        <mesh castShadow position={[0, 7.9, 0]}>
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <Toon color="#f5b942" />
        </mesh>
        <mesh castShadow position={[0, 8, 0]}>
          <boxGeometry args={[0.9, 0.3, 0.3]} />
          <Toon color="#f5b942" />
        </mesh>
      </group>
      <group position={[1.3, 0.16, 1.3]}>
        <mesh castShadow geometry={rook}>
          <Toon color="#3a2d4f" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2).map((angle) => (
          <mesh key={angle} castShadow position={[Math.cos(angle) * 1.05, 5.35, Math.sin(angle) * 1.05]}>
            <boxGeometry args={[0.5, 0.7, 0.5]} />
            <Toon color="#3a2d4f" />
          </mesh>
        ))}
      </group>
    </>
  )
}

function MessageTower() {
  return (
    <>
      <mesh castShadow position={[0, 4.5, 0]}>
        <cylinderGeometry args={[1.3, 1.6, 9, 8]} />
        <Toon color="#e9dcc4" />
      </mesh>
      <mesh position={[0, 9.8, 0]}>
        <boxGeometry args={[1.8, 1.6, 1.8]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh castShadow position={[0, 11.6, 0]} rotation={[0, Math.PI / 8, 0]}>
        <coneGeometry args={[1.8, 2.4, 8]} />
        <Toon color="#3f8f86" />
      </mesh>
      <mesh position={[0, 1.3, 1.5]}>
        <boxGeometry args={[1, 2.6, 0.05]} />
        <Toon color="#3a2d4f" />
      </mesh>
      <mesh castShadow position={[2, 0.6, 1.2]}>
        <boxGeometry args={[0.7, 1.2, 0.5]} />
        <Toon color="#d9534f" />
      </mesh>
    </>
  )
}

const models: Record<LandmarkId, () => React.JSX.Element> = {
  keep: Keep,
  academy: Academy,
  archive: Archive,
  citadel: Citadel,
  post: MessageTower,
}

function Marker({ height, animate }: { height: number; animate: boolean }) {
  const marker = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!animate || !marker.current) return
    marker.current.rotation.y = clock.elapsedTime * 1.2
    marker.current.position.y = height + 2 + Math.sin(clock.elapsedTime * 2) * 0.35
  })
  return (
    <mesh ref={marker} position={[0, height + 2, 0]}>
      <octahedronGeometry args={[0.7]} />
      <meshBasicMaterial color="#f5b942" />
    </mesh>
  )
}

function LandmarkModel({ landmark, animate }: { landmark: Landmark; animate: boolean }) {
  const Model = models[landmark.id]
  const facing = Math.atan2(FOUNTAIN.x - landmark.x, FOUNTAIN.z - landmark.z)
  return (
    <group position={[landmark.x, 0, landmark.z]}>
      <group rotation={[0, facing, 0]}>
        <Model />
      </group>
      <Marker height={landmark.height} animate={animate} />
      <Html position={[0, landmark.height + 3.6, 0]} center zIndexRange={[5, 0]}>
        <span className="world-label">{landmark.name}</span>
      </Html>
    </group>
  )
}

export default function Landmarks({ animate }: { animate: boolean }) {
  return (
    <>
      {landmarks.map((landmark) => (
        <LandmarkModel key={landmark.id} landmark={landmark} animate={animate} />
      ))}
    </>
  )
}
