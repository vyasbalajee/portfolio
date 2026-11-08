import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BufferAttribute,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  MeshToonMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { decor, houses, trees, type DecorKind, type HouseVariant, type TreeKind } from './layout'
import { gradient } from './Toon'

const VILLAGE = '/models/village.glb'
const NATURE = '/models/nature.glb'
export const HERO = '/models/hero.glb'
export const HERO_ANIMATIONS = '/models/hero-animations.glb'

// Draco stays off (its decoder would load from a CDN); meshopt decodes locally.
export const useModel = (url: string) => useGLTF(url, false, true)

const toonCache = new WeakMap<Material, MeshToonMaterial>()

export function toToon(material: Material, overrideColor?: string) {
  const source = material as MeshStandardMaterial
  if (!overrideColor && toonCache.has(material)) return toonCache.get(material)!
  const toon = new MeshToonMaterial({
    color: overrideColor ?? source.color,
    map: overrideColor ? null : source.map,
    gradientMap: gradient,
    transparent: source.transparent,
    alphaTest: source.alphaTest,
    side: source.side,
  })
  if (!overrideColor) toonCache.set(material, toon)
  return toon
}

// Swaps every material in a loaded model for its cel-shaded twin.
export function toonify(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    mesh.material = toToon(mesh.material as Material)
    mesh.castShadow = true
    mesh.receiveShadow = true
  })
}

type Part = { geometry: BufferGeometry; material: Material }
type Placement = { object: Object3D; matrix: Matrix4; recolor?: Record<string, string> }

const kept = ['position', 'normal', 'uv']

// Meshopt stores positions as quantized integers; world-space baking needs real floats.
function toFloat(attribute: BufferAttribute) {
  const array = new Float32Array(attribute.count * attribute.itemSize)
  for (let i = 0; i < attribute.count; i++) {
    for (let c = 0; c < attribute.itemSize; c++) array[i * attribute.itemSize + c] = attribute.getComponent(i, c)
  }
  return new Float32BufferAttribute(array, attribute.itemSize)
}

// Bakes several placed model pieces into one geometry per material, so a whole house
// design draws in a few calls and can be instanced across the city.
function bake(placements: Placement[]): Part[] {
  const buckets = new Map<Material, BufferGeometry[]>()
  const relative = new Matrix4()
  const rootInverse = new Matrix4()

  for (const { object, matrix, recolor } of placements) {
    object.updateWorldMatrix(true, true)
    // Relative to the parent, so the piece's own transform (which also carries meshopt's
    // dequantization scale) is kept.
    rootInverse.copy(object.parent?.matrixWorld ?? new Matrix4()).invert()
    object.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const source = mesh.material as Material
      const material = recolor?.[source.name] ? toToon(source, recolor[source.name]) : toToon(source)
      const geometry = mesh.geometry.clone()
      for (const name of Object.keys(geometry.attributes)) {
        if (!kept.includes(name)) geometry.deleteAttribute(name)
        else geometry.setAttribute(name, toFloat(geometry.getAttribute(name) as BufferAttribute))
      }
      if (!geometry.getAttribute('uv')) {
        geometry.setAttribute('uv', new Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 2), 2))
      }
      relative.multiplyMatrices(rootInverse, mesh.matrixWorld)
      geometry.applyMatrix4(new Matrix4().multiplyMatrices(matrix, relative))
      const list = buckets.get(material) ?? []
      list.push(geometry)
      buckets.set(material, list)
    })
  }

  return [...buckets].map(([material, list]) => {
    const indexed = list.every((g) => g.index)
    const geometry = mergeGeometries(indexed ? list : list.map((g) => (g.index ? g.toNonIndexed() : g)))!
    geometry.computeBoundingSphere()
    return { geometry, material }
  })
}

const position = new Vector3()
const rotation = new Quaternion()
const scale = new Vector3()
const euler = new Euler()

function compose(x: number, y: number, z: number, rotationY = 0, size = 1) {
  return new Matrix4().compose(
    position.set(x, y, z),
    rotation.setFromEuler(euler.set(0, rotationY, 0)),
    scale.set(size, size, size),
  )
}

function InstancedPart({ part, matrices }: { part: Part; matrices: Matrix4[] }) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    matrices.forEach((matrix, i) => mesh.current!.setMatrixAt(i, matrix))
    mesh.current.instanceMatrix.needsUpdate = true
  }, [matrices])
  return (
    <instancedMesh
      ref={mesh}
      args={[part.geometry, part.material, matrices.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}

function Instances({ parts, matrices }: { parts: Part[]; matrices: Matrix4[] }) {
  if (matrices.length === 0) return null
  return (
    <>
      {parts.map((part, i) => (
        <InstancedPart key={i} part={part} matrices={matrices} />
      ))}
    </>
  )
}

// House designs, assembled from the Quaternius modular pieces (walls are 2 m wide, 3.12 m tall).
const STOREY = 3.12
type Side = 'front' | 'back' | 'left' | 'right'
type Piece = { name: string; x: number; y: number; z: number; rotation: number }

function walls(width: number, depth: number, y: number, pieces: Record<Side, string[]>, corner: string): Piece[] {
  const list: Piece[] = []
  const along = (count: number) => Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * 2)
  along(width / 2).forEach((x, i) => {
    list.push({ name: pieces.front[i], x, y, z: depth / 2, rotation: 0 })
    list.push({ name: pieces.back[i], x: -x, y, z: -depth / 2, rotation: Math.PI })
  })
  along(depth / 2).forEach((z, i) => {
    list.push({ name: pieces.right[i], x: width / 2, y, z: -z, rotation: Math.PI / 2 })
    list.push({ name: pieces.left[i], x: -width / 2, y, z, rotation: -Math.PI / 2 })
  })
  for (const [x, z] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    list.push({ name: corner, x: (x * width) / 2, y, z: (z * depth) / 2, rotation: 0 })
  }
  return list
}

const plaster = 'Wall_Plaster_Straight'
const plasterDoor = 'Wall_Plaster_Door_Round'
const plasterWindow = 'Wall_Plaster_Window_Wide_Round'
const woodGrid = 'Wall_Plaster_WoodGrid'
const brick = 'Wall_UnevenBrick_Straight'
const brickDoor = 'Wall_UnevenBrick_Door_Round'
const brickWindow = 'Wall_UnevenBrick_Window_Wide_Round'

const designs: Record<HouseVariant, Piece[]> = {
  cottage: [
    ...walls(
      4,
      4,
      0,
      {
        front: [plasterWindow, plasterDoor],
        back: [plaster, plasterWindow],
        left: [plasterWindow, woodGrid],
        right: [woodGrid, plasterWindow],
      },
      'Corner_Exterior_Wood',
    ),
    { name: 'Roof_RoundTiles_4x4', x: 0, y: STOREY, z: 0, rotation: 0 },
  ],
  townhouse: [
    ...walls(
      4,
      4,
      0,
      { front: [brickDoor, brickWindow], back: [brick, brickWindow], left: [brickWindow, brick], right: [brick, brickWindow] },
      'Corner_Exterior_Brick',
    ),
    ...walls(
      4,
      4,
      STOREY,
      {
        front: [plasterWindow, plasterWindow],
        back: [woodGrid, plasterWindow],
        left: [plasterWindow, woodGrid],
        right: [woodGrid, plasterWindow],
      },
      'Corner_Exterior_Wood',
    ),
    { name: 'Roof_RoundTiles_4x4', x: 0, y: STOREY * 2, z: 0, rotation: 0 },
    { name: 'Prop_Chimney', x: 1, y: STOREY * 2 + 0.6, z: -1, rotation: 0 },
  ],
  longhouse: [
    ...walls(
      4,
      6,
      0,
      {
        front: [plasterDoor, plasterWindow],
        back: [plasterWindow, plaster],
        left: [plasterWindow, woodGrid, plasterWindow],
        right: [plasterWindow, plasterDoor, plasterWindow],
      },
      'Corner_Exterior_Wood',
    ),
    { name: 'Roof_RoundTiles_4x6', x: 0, y: STOREY, z: 0, rotation: 0 },
  ],
}

export function Village() {
  const { nodes } = useModel(VILLAGE)
  const parts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(designs).map(([variant, pieces]) => [
          variant,
          bake(pieces.map((p) => ({ object: nodes[p.name], matrix: compose(p.x, p.y, p.z, p.rotation) }))),
        ]),
      ) as Record<HouseVariant, Part[]>,
    [nodes],
  )
  const matrices = useMemo(() => {
    const byVariant: Record<HouseVariant, Matrix4[]> = { cottage: [], townhouse: [], longhouse: [] }
    for (const h of houses) byVariant[h.variant].push(compose(h.x, 0, h.z, h.rotation))
    return byVariant
  }, [])

  return (
    <>
      {(Object.keys(designs) as HouseVariant[]).map((variant) => (
        <Instances key={variant} parts={parts[variant]} matrices={matrices[variant]} />
      ))}
    </>
  )
}

// Kenney models are small (a tree is ~1.5 m), so each kind gets a base scale.
const treeModels: Record<TreeKind, { name: string; size: number; recolor?: Record<string, string> }> = {
  blossom: { name: 'tree_default', size: 3, recolor: { leafsGreen: '#f4a7bb' } },
  pine: { name: 'tree_pineRoundA', size: 3.2 },
  tallPine: { name: 'tree_pineTallA', size: 2.6 },
  oak: { name: 'tree_oak', size: 3.4 },
  round: { name: 'tree_fat', size: 3.6, recolor: { leafsGreen: '#7cc46a' } },
}

const decorModels: Record<DecorKind, { name: string; size: number }> = {
  bush: { name: 'plant_bushLarge', size: 4 },
  smallBush: { name: 'plant_bush', size: 4 },
  redFlower: { name: 'flower_redA', size: 3 },
  yellowFlower: { name: 'flower_yellowA', size: 3 },
  purpleFlower: { name: 'flower_purpleA', size: 3 },
  rock: { name: 'rock_largeA', size: 2.4 },
  pebble: { name: 'rock_smallC', size: 3 },
}

export function Nature() {
  const { nodes } = useModel(NATURE)
  const groups = useMemo(() => {
    const list: { key: string; parts: Part[]; matrices: Matrix4[] }[] = []
    for (const [kind, model] of Object.entries(treeModels)) {
      list.push({
        key: kind,
        parts: bake([{ object: nodes[model.name], matrix: new Matrix4(), recolor: model.recolor }]),
        matrices: trees.filter((t) => t.kind === kind).map((t) => compose(t.x, 0, t.z, t.rotation, model.size * t.scale)),
      })
    }
    for (const [kind, model] of Object.entries(decorModels)) {
      list.push({
        key: kind,
        parts: bake([{ object: nodes[model.name], matrix: new Matrix4() }]),
        matrices: decor.filter((d) => d.kind === kind).map((d) => compose(d.x, 0, d.z, d.rotation, model.size * d.scale)),
      })
    }
    return list
  }, [nodes])

  return (
    <>
      {groups.map(({ key, parts, matrices }) => (
        <Instances key={key} parts={parts} matrices={matrices} />
      ))}
    </>
  )
}

useGLTF.preload(VILLAGE, false, true)
useGLTF.preload(NATURE, false, true)
useGLTF.preload(HERO, false, true)
useGLTF.preload(HERO_ANIMATIONS, false, true)
