import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  BackSide,
  Color,
  Vector3,
  type DirectionalLight,
  type HemisphereLight,
  type Mesh,
  type MeshBasicMaterial,
  type PointsMaterial,
} from 'three'
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

export type TimeOfDay = 'day' | 'golden' | 'night'

export function localTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours()
  if (hour >= 19 || hour < 6) return 'night'
  if (hour >= 17 || hour < 8) return 'golden'
  return 'day'
}

type Palette = {
  top: string
  middle: string
  bottom: string
  fog: string
  hemiSky: string
  hemiGround: string
  hemi: number
  light: string
  lightIntensity: number
  // The sun by day, the moon at night.
  direction: [number, number, number]
  disc: string
  halo: string
  stars: number
}

const palettes: Record<TimeOfDay, Palette> = {
  day: {
    top: '#3f7fd1',
    middle: '#9fcdf0',
    bottom: '#f4efd8',
    fog: '#cfe3ef',
    hemiSky: '#ffffff',
    hemiGround: '#8a9a6b',
    hemi: 1.6,
    light: '#fff3d6',
    lightIntensity: 2.8,
    direction: [-0.4, 0.8, -0.45],
    disc: '#fffbe8',
    halo: '#fff2b0',
    stars: 0,
  },
  golden: {
    top: '#2c2160',
    middle: '#e9826a',
    bottom: '#ffd9a0',
    fog: SKY_FOG,
    hemiSky: '#ffe6c7',
    hemiGround: '#7a5b86',
    hemi: 1.4,
    light: '#ffd2a6',
    lightIntensity: 2.6,
    direction: SUN_DIRECTION,
    disc: '#fff0c4',
    halo: '#ffd27a',
    stars: 0.15,
  },
  night: {
    top: '#060a22',
    middle: '#1b2452',
    bottom: '#3b3a72',
    fog: '#1e2446',
    hemiSky: '#8fa3ff',
    hemiGround: '#1a1530',
    hemi: 0.95,
    light: '#aebcff',
    lightIntensity: 0.9,
    direction: [0.5, 0.55, -0.62],
    disc: '#eef1ff',
    halo: '#9fb0ff',
    stars: 1,
  },
}

function starPositions() {
  const positions = new Float32Array(700 * 3)
  let seed = 3
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 700; i++) {
    const theta = random() * Math.PI * 2
    const y = 0.05 + random() * 0.95
    const r = Math.sqrt(1 - y * y)
    positions.set([Math.cos(theta) * r * 380, y * 380, Math.sin(theta) * r * 380], i * 3)
  }
  return positions
}

// Lights, sky, sun or moon, fog and stars, easing towards the palette for the current time.
function Lighting({ time, shadows }: { time: TimeOfDay; shadows: boolean }) {
  const scene = useThree((three) => three.scene)
  const hemi = useRef<HemisphereLight>(null)
  const light = useRef<DirectionalLight>(null)
  const disc = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const stars = useRef<PointsMaterial>(null)
  const stars3 = useMemo(starPositions, [])
  const target = useMemo(() => new Color(), [])
  const direction = useMemo(() => new Vector3(...palettes.golden.direction), [])
  const goal = useMemo(() => new Vector3(), [])

  useFrame((_, rawDelta) => {
    const p = palettes[time]
    const t = 1 - Math.exp(-2.5 * Math.min(rawDelta, 0.1))
    const ease = (color: Color, value: string) => color.lerp(target.set(value), t)

    ease(skyShader.uniforms.top.value, p.top)
    ease(skyShader.uniforms.middle.value, p.middle)
    ease(skyShader.uniforms.bottom.value, p.bottom)
    if (scene.fog) ease(scene.fog.color, p.fog)
    if (scene.background instanceof Color) ease(scene.background, p.fog)

    direction.lerp(goal.set(...p.direction), t).normalize()
    if (hemi.current) {
      ease(hemi.current.color, p.hemiSky)
      ease(hemi.current.groundColor, p.hemiGround)
      hemi.current.intensity += (p.hemi - hemi.current.intensity) * t
    }
    if (light.current) {
      ease(light.current.color, p.light)
      light.current.intensity += (p.lightIntensity - light.current.intensity) * t
      light.current.position.copy(direction).multiplyScalar(90)
    }
    if (disc.current && halo.current) {
      disc.current.position.copy(direction).multiplyScalar(360)
      halo.current.position.copy(disc.current.position)
      ease((disc.current.material as MeshBasicMaterial).color, p.disc)
      ease((halo.current.material as MeshBasicMaterial).color, p.halo)
    }
    if (stars.current) stars.current.opacity += (p.stars - stars.current.opacity) * t
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={[palettes.golden.hemiSky, palettes.golden.hemiGround, palettes.golden.hemi]} />
      <directionalLight
        ref={light}
        position={palettes.golden.direction.map((v) => v * 90) as [number, number, number]}
        intensity={palettes.golden.lightIntensity}
        color={palettes.golden.light}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-far={220}
        shadow-bias={-0.0006}
      />
      <mesh>
        <sphereGeometry args={[420, 32, 16]} />
        <shaderMaterial args={[skyShader]} side={BackSide} depthWrite={false} fog={false} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars3, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={stars} color="#ffffff" size={2} sizeAttenuation={false} transparent opacity={0.15} fog={false} depthWrite={false} />
      </points>
      <mesh ref={disc}>
        <sphereGeometry args={[20, 24, 12]} />
        <meshBasicMaterial color={palettes.golden.disc} fog={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[36, 24, 12]} />
        <meshBasicMaterial color={palettes.golden.halo} transparent opacity={0.3} fog={false} />
      </mesh>
    </>
  )
}

// Lamp posts along the streets; they glow warmly, which reads best after dark.
function Lamps() {
  const spots = useMemo(() => {
    const list: [number, number][] = []
    for (const [a, b] of paths) {
      const length = Math.hypot(b.x - a.x, b.z - a.z)
      const nx = -(b.z - a.z) / length
      const nz = (b.x - a.x) / length
      for (let d = 6; d < length - 4; d += 9) {
        const side = list.length % 2 === 0 ? 1 : -1
        list.push([a.x + ((b.x - a.x) * d) / length + nx * 2.3 * side, a.z + ((b.z - a.z) * d) / length + nz * 2.3 * side])
      }
    }
    return list
  }, [])
  return (
    <>
      {spots.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 2.8, 6]} />
            <Toon color="#3a2d4f" />
          </mesh>
          <mesh position={[0, 2.95, 0]}>
            <boxGeometry args={[0.42, 0.5, 0.42]} />
            <meshBasicMaterial color="#ffd27a" />
          </mesh>
        </group>
      ))}
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

export default function Environment({ shadows, time }: { shadows: boolean; time: TimeOfDay }) {
  return (
    <>
      <color attach="background" args={[SKY_FOG]} />
      <fog attach="fog" args={[SKY_FOG, 80, 280]} />
      <Lighting time={time} shadows={shadows} />
      <Lamps />
      <Clouds />
      <Island />
      <Walls />
      <Paths />
      <Fountain />
    </>
  )
}
