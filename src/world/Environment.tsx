import { useMemo } from 'react'
import { BackSide, Color } from 'three'
import { FOUNTAIN, GATE_ANGLE, WALL_RADIUS, paths } from './layout'
import Toon from './Toon'

export const SKY_FOG = '#f3b08a'
export const SUN_DIRECTION: [number, number, number] = [-0.62, 0.36, -0.7]

const skyShader = {
  uniforms: {
    top: { value: new Color('#2c2160') },
    middle: { value: new Color('#e9826a') },
    bottom: { value: new Color('#ffd9a0') },
  },
  vertexShader: `
    varying vec3 vDirection;
    void main() {
      vDirection = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 top;
    uniform vec3 middle;
    uniform vec3 bottom;
    varying vec3 vDirection;
    void main() {
      float h = vDirection.y;
      vec3 color = h > 0.12
        ? mix(middle, top, smoothstep(0.12, 0.65, h))
        : mix(bottom, middle, smoothstep(-0.15, 0.12, h));
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }`,
}

function Sky() {
  const sun = SUN_DIRECTION.map((v) => v * 360) as [number, number, number]
  return (
    <>
      <mesh>
        <sphereGeometry args={[420, 32, 16]} />
        <shaderMaterial args={[skyShader]} side={BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={sun}>
        <sphereGeometry args={[22, 24, 12]} />
        <meshBasicMaterial color="#fff0c4" fog={false} />
      </mesh>
      <mesh position={sun}>
        <sphereGeometry args={[38, 24, 12]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.3} fog={false} />
      </mesh>
    </>
  )
}

function seededPuffs(count: number, seed: number, place: (r: () => number) => [number, number, number, number]) {
  let s = seed
  const random = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: count }, () => place(random))
}

function Clouds() {
  const sea = useMemo(
    () =>
      seededPuffs(46, 11, (r) => {
        const angle = r() * Math.PI * 2
        const distance = 75 + r() * 140
        return [Math.cos(angle) * distance, -24 + r() * 10, Math.sin(angle) * distance, 12 + r() * 16]
      }),
    [],
  )
  const high = useMemo(
    () =>
      seededPuffs(14, 5, (r) => {
        const angle = r() * Math.PI * 2
        const distance = 95 + r() * 80
        return [Math.cos(angle) * distance, 32 + r() * 28, Math.sin(angle) * distance, 5 + r() * 6]
      }),
    [],
  )

  return (
    <>
      {sea.map(([x, y, z, size], i) => (
        <mesh key={`sea-${i}`} position={[x, y, z]} scale={[size * 1.6, size * 0.6, size]}>
          <sphereGeometry args={[1, 16, 10]} />
          <Toon color="#ffd8c4" />
        </mesh>
      ))}
      {high.map(([x, y, z, size], i) => (
        <group key={`high-${i}`} position={[x, y, z]}>
          {[-1, 0, 1].map((offset) => (
            <mesh key={offset} position={[offset * size * 1.1, offset === 0 ? size * 0.35 : 0, 0]} scale={size}>
              <sphereGeometry args={[1, 14, 10]} />
              <Toon color="#ffe6d6" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Island() {
  return (
    <>
      <mesh receiveShadow position={[0, -1, 0]}>
        <cylinderGeometry args={[62, 60, 2, 72]} />
        <Toon color="#9cc46f" />
      </mesh>
      <mesh position={[0, -22, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[60, 40, 18]} />
        <Toon color="#6e4f6b" />
      </mesh>
      <mesh position={[0, -2.6, 0]}>
        <cylinderGeometry args={[60.5, 59, 1.4, 72]} />
        <Toon color="#8a6a5e" />
      </mesh>
    </>
  )
}

function Tower({ x, z, height = 9, radius = 2 }: { x: number; z: number; height?: number; radius?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.1, height, 16]} />
        <Toon color="#e7d7bd" />
      </mesh>
      <mesh castShadow position={[0, height + 1.8, 0]}>
        <coneGeometry args={[radius * 1.3, 3.6, 16]} />
        <Toon color="#d9534f" />
      </mesh>
    </group>
  )
}

function Walls() {
  const count = 56
  const segments = useMemo(() => {
    const list: number[] = []
    for (let i = 0; i < count; i++) {
      const angle = ((i + 0.5) / count) * Math.PI * 2
      const offset = Math.atan2(Math.sin(angle - GATE_ANGLE), Math.cos(angle - GATE_ANGLE))
      if (Math.abs(offset) > 0.12) list.push(angle)
    }
    return list
  }, [])
  const length = ((Math.PI * 2 * WALL_RADIUS) / count) * 1.04
  const gateTowers = [GATE_ANGLE - 0.13, GATE_ANGLE + 0.13]

  return (
    <>
      {segments.map((angle) => (
        <group
          key={angle}
          position={[Math.cos(angle) * WALL_RADIUS, 0, Math.sin(angle) * WALL_RADIUS]}
          rotation={[0, -(angle + Math.PI / 2), 0]}
        >
          <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
            <boxGeometry args={[length, 5, 1.6]} />
            <Toon color="#e7d7bd" />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <boxGeometry args={[length, 0.5, 2]} />
            <Toon color="#cdb89a" />
          </mesh>
        </group>
      ))}
      {segments
        .filter((_, i) => i % 7 === 3)
        .map((angle) => (
          <Tower key={angle} x={Math.cos(angle) * WALL_RADIUS} z={Math.sin(angle) * WALL_RADIUS} />
        ))}
      {gateTowers.map((angle) => (
        <Tower key={angle} x={Math.cos(angle) * WALL_RADIUS} z={Math.sin(angle) * WALL_RADIUS} height={11} radius={2.3} />
      ))}
      <mesh castShadow position={[0, 9, WALL_RADIUS]}>
        <boxGeometry args={[11, 2.2, 2]} />
        <Toon color="#e7d7bd" />
      </mesh>
      <mesh position={[0, 7.6, WALL_RADIUS + 1.05]}>
        <boxGeometry args={[3, 1.6, 0.1]} />
        <Toon color="#f5b942" />
      </mesh>
    </>
  )
}

function Paths() {
  return (
    <>
      {paths.map(([a, b], i) => {
        const dx = b.x - a.x
        const dz = b.z - a.z
        return (
          <mesh
            key={i}
            receiveShadow
            position={[(a.x + b.x) / 2, 0.02, (a.z + b.z) / 2]}
            rotation={[0, -Math.atan2(dz, dx), 0]}
          >
            <boxGeometry args={[Math.hypot(dx, dz), 0.04, 3.2]} />
            <Toon color="#ead3a8" />
          </mesh>
        )
      })}
      <mesh receiveShadow position={[FOUNTAIN.x, 0.03, FOUNTAIN.z]}>
        <cylinderGeometry args={[7, 7, 0.06, 40]} />
        <Toon color="#ead3a8" />
      </mesh>
    </>
  )
}

function Fountain() {
  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[2.6, 2.8, 0.8, 32]} />
        <Toon color="#d9c7b0" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[2.3, 2.3, 0.08, 32]} />
        <meshToonMaterial color="#7fc8e8" />
      </mesh>
      <mesh castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 1.8, 12]} />
        <Toon color="#d9c7b0" />
      </mesh>
      <mesh castShadow position={[0, 2.6, 0]}>
        <cylinderGeometry args={[1.1, 0.4, 0.5, 20]} />
        <Toon color="#d9c7b0" />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.45, 16, 10]} />
        <meshBasicMaterial color="#bfe8f7" />
      </mesh>
    </group>
  )
}

export default function Environment({ shadows }: { shadows: boolean }) {
  const sun = SUN_DIRECTION.map((v) => v * 90) as [number, number, number]
  return (
    <>
      <color attach="background" args={[SKY_FOG]} />
      <fog attach="fog" args={[SKY_FOG, 80, 280]} />
      <hemisphereLight args={['#ffe6c7', '#7a5b86', 1.4]} />
      <directionalLight
        position={sun}
        intensity={2.6}
        color="#ffd2a6"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-far={220}
        shadow-bias={-0.0006}
      />
      <Sky />
      <Clouds />
      <Island />
      <Walls />
      <Paths />
      <Fountain />
    </>
  )
}
