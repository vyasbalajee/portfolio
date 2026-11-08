import { profile, projects } from '../content'

export type LandmarkId = 'keep' | 'academy' | 'archive' | 'citadel' | 'post'

export type Landmark = {
  id: LandmarkId
  name: string
  x: number
  z: number
  // Footprint used for layout and the interaction range.
  radius: number
  // Radius the hero can't walk into.
  solid: number
  height: number
  blurb: string
  href: string
  cta: string
}

export type Point = { x: number; z: number }
export type Collider = Point & { r: number }

export type HouseVariant = 'cottage' | 'townhouse' | 'longhouse'
export type House = Point & { rotation: number; variant: HouseVariant }

export type TreeKind = 'pine' | 'tallPine' | 'blossom' | 'oak' | 'round'
export type Tree = Point & { kind: TreeKind; scale: number; rotation: number }

export type DecorKind = 'bush' | 'smallBush' | 'redFlower' | 'yellowFlower' | 'purpleFlower' | 'rock' | 'pebble'
export type Decor = Point & { kind: DecorKind; scale: number; rotation: number }

// Footprint radius of each house design, used for spacing and collisions.
export const houseRadius: Record<HouseVariant, number> = { cottage: 3, townhouse: 3, longhouse: 3.7 }

export const WALL_RADIUS = 50
export const WALK_RADIUS = 44
export const GATE_ANGLE = Math.PI / 2
export const SPAWN: Point = { x: 0, z: 30 }
export const FOUNTAIN: Collider = { x: 0, z: 6, r: 2.6 }
export const INTERACT_RANGE = 3.5

function projectBySlug(slug: string) {
  const project = projects.find((item) => item.slug === slug)
  if (!project) throw new Error(`Unknown project: ${slug}`)
  return project
}

const etalvis = projectBySlug('etalvis-quiz-platform')
const skipcourse = projectBySlug('ai-assessment-platform')
const chess = projectBySlug('chess-engine')

export const landmarks: Landmark[] = [
  {
    id: 'keep',
    name: 'The keep',
    x: 0,
    z: -26,
    radius: 8,
    solid: 7.5,
    height: 24,
    blurb: profile.intro,
    href: '/#experience',
    cta: 'See my experience',
  },
  {
    id: 'academy',
    name: etalvis.name,
    x: -26,
    z: -6,
    radius: 5,
    solid: 4.5,
    height: 21,
    blurb: etalvis.summary,
    href: `/work/${etalvis.slug}`,
    cta: 'Read the case study',
  },
  {
    id: 'archive',
    name: skipcourse.name,
    x: 26,
    z: -6,
    radius: 6.5,
    solid: 6.5,
    height: 12,
    blurb: skipcourse.summary,
    href: `/work/${skipcourse.slug}`,
    cta: 'Read the case study',
  },
  {
    id: 'citadel',
    name: chess.name,
    x: 22,
    z: 22,
    radius: 6,
    solid: 2.6,
    height: 11,
    blurb: chess.summary,
    href: `/work/${chess.slug}`,
    cta: 'Read the case study',
  },
  {
    id: 'post',
    name: 'Message tower',
    x: -22,
    z: 22,
    radius: 3,
    solid: 2,
    height: 13,
    blurb: profile.availability,
    href: '/#contact',
    cta: 'Get in touch',
  },
]

export type NpcId = 'sage' | 'knight' | 'ranger' | 'guard'
export type Npc = Point & {
  id: NpcId
  name: string
  model: 'mage' | 'knight' | 'ranger' | 'barbarian'
  // The sage opens the AI chat instead of reciting lines.
  opensChat?: boolean
  lines: string[]
}

export const npcs: Npc[] = [
  {
    id: 'sage',
    name: 'The sage',
    model: 'mage',
    x: 5,
    z: 11,
    opensChat: true,
    lines: ["Greetings, traveller. I know Vyas's story well. Ask me anything about his work."],
  },
  {
    id: 'guard',
    name: 'The gate guard',
    model: 'barbarian',
    x: -4,
    z: 24,
    lines: [
      'Welcome to the kingdom! Walk with WASD or the joystick, and use the map in the corner to travel.',
      `Each landmark holds a piece of ${profile.name}'s work. Walk up to one and step inside.`,
      'Stay a while. The kingdom changes with the time of day.',
    ],
  },
  {
    id: 'knight',
    name: 'The keep knight',
    model: 'knight',
    x: 7,
    z: -15,
    lines: [
      `Behind me is the keep, where ${profile.name}'s experience is recorded.`,
      `He's been the sole developer of the Etalvis quiz platform since May 2025. The academy tower to the west tells that tale.`,
      'Legend says the fountain grants a gift to those who make enough wishes.',
    ],
  },
  {
    id: 'ranger',
    name: 'The ranger',
    model: 'ranger',
    x: 15,
    z: 15,
    lines: [
      `The chess citadel holds ${profile.name}'s engine, written in C++.`,
      "He's teaching it to judge positions with a neural network.",
      'Speak with everyone in town, and the sky may celebrate.',
    ],
  },
]

export const paths: [Point, Point][] =[[SPAWN, FOUNTAIN], ...landmarks.map((l): [Point, Point] => [FOUNTAIN, l])]

// Spot just in front of a landmark, on the side facing the fountain.
export function arrivalPoint(landmark: Landmark): Point {
  const dx = FOUNTAIN.x - landmark.x
  const dz = FOUNTAIN.z - landmark.z
  const length = Math.hypot(dx, dz)
  const distance = landmark.radius + 2
  return { x: landmark.x + (dx / length) * distance, z: landmark.z + (dz / length) * distance }
}

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function distanceToSegment(p: Point, a: Point, b: Point) {
  const abx = b.x - a.x
  const abz = b.z - a.z
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / (abx * abx + abz * abz)))
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t))
}

// Kept clear around the start point and the camera behind it, so the opening view is open.
const ARRIVAL_CLEARING: Collider = { x: SPAWN.x, z: SPAWN.z + 5, r: 9 }

function isOpenGround(p: Point, clearance: number) {
  return (
    Math.hypot(p.x - ARRIVAL_CLEARING.x, p.z - ARRIVAL_CLEARING.z) > ARRIVAL_CLEARING.r + clearance &&
    !npcs.some((n) => Math.hypot(p.x - n.x, p.z - n.z) < clearance + 2.5) &&
    !landmarks.some((l) => Math.hypot(p.x - l.x, p.z - l.z) < l.radius + clearance + 2) &&
    !paths.some(([a, b]) => distanceToSegment(p, a, b) < clearance + 1.8) &&
    Math.hypot(p.x - FOUNTAIN.x, p.z - FOUNTAIN.z) > FOUNTAIN.r + clearance + 3
  )
}

const variants: HouseVariant[] = ['cottage', 'cottage', 'townhouse', 'longhouse']
const treeKinds: TreeKind[] = ['blossom', 'blossom', 'pine', 'tallPine', 'oak', 'round']
const decorKinds: DecorKind[] = ['bush', 'bush', 'smallBush', 'redFlower', 'yellowFlower', 'purpleFlower', 'rock', 'pebble']

function randomSpot(random: () => number, min: number, max: number): Point {
  const angle = random() * Math.PI * 2
  const distance = min + random() * (max - min)
  return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
}

function buildHouses() {
  const random = seeded(7)
  const houses: House[] = []
  for (let attempt = 0; attempt < 2000 && houses.length < 34; attempt++) {
    const spot = randomSpot(random, 13, 41)
    const variant = variants[Math.floor(random() * variants.length)]
    const radius = houseRadius[variant]
    if (!isOpenGround(spot, radius)) continue
    if (houses.some((h) => Math.hypot(h.x - spot.x, h.z - spot.z) < radius + houseRadius[h.variant] + 1.6)) continue
    // Face the nearest path so front doors open onto the street.
    const facing = Math.atan2(FOUNTAIN.x - spot.x, FOUNTAIN.z - spot.z)
    houses.push({ ...spot, variant, rotation: Math.round(facing / (Math.PI / 2)) * (Math.PI / 2) })
  }
  return houses
}

function clearOfHouses(p: Point, houses: House[], gap: number) {
  return houses.every((h) => Math.hypot(h.x - p.x, h.z - p.z) > houseRadius[h.variant] + gap)
}

function buildTrees(houses: House[]) {
  const random = seeded(21)
  const trees: Tree[] = []
  for (let attempt = 0; attempt < 2000 && trees.length < 64; attempt++) {
    const spot = randomSpot(random, 9, 45)
    if (!isOpenGround(spot, 0.9) || !clearOfHouses(spot, houses, 1.2)) continue
    if (trees.some((t) => Math.hypot(t.x - spot.x, t.z - spot.z) < 2.6)) continue
    trees.push({
      ...spot,
      kind: treeKinds[Math.floor(random() * treeKinds.length)],
      scale: 0.85 + random() * 0.4,
      rotation: random() * Math.PI * 2,
    })
  }
  return trees
}

function buildDecor(houses: House[], trees: Tree[]) {
  const random = seeded(33)
  const decor: Decor[] = []
  for (let attempt = 0; attempt < 3000 && decor.length < 110; attempt++) {
    const spot = randomSpot(random, 8, 46)
    if (!isOpenGround(spot, 0.2) || !clearOfHouses(spot, houses, 0.3)) continue
    if (trees.some((t) => Math.hypot(t.x - spot.x, t.z - spot.z) < 1.2)) continue
    decor.push({
      ...spot,
      kind: decorKinds[Math.floor(random() * decorKinds.length)],
      scale: 0.8 + random() * 0.5,
      rotation: random() * Math.PI * 2,
    })
  }
  return decor
}

export const houses = buildHouses()
export const trees = buildTrees(houses)
export const decor = buildDecor(houses, trees)

const colliders: Collider[] = [
  FOUNTAIN,
  ...landmarks.map((l) => ({ x: l.x, z: l.z, r: l.solid })),
  ...houses.map((h) => ({ x: h.x, z: h.z, r: houseRadius[h.variant] })),
  ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.55 })),
  ...npcs.map((n) => ({ x: n.x, z: n.z, r: 0.6 })),
]

export function resolveCollisions(p: Point, radius = 0.5) {
  for (const c of colliders) {
    const dx = p.x - c.x
    const dz = p.z - c.z
    const distance = Math.hypot(dx, dz)
    const min = c.r + radius
    if (distance < min && distance > 0.0001) {
      p.x = c.x + (dx / distance) * min
      p.z = c.z + (dz / distance) * min
    }
  }
  const fromCenter = Math.hypot(p.x, p.z)
  if (fromCenter > WALK_RADIUS) {
    p.x *= WALK_RADIUS / fromCenter
    p.z *= WALK_RADIUS / fromCenter
  }
}

// Anything the hero can interact with: 'keep', 'npc:sage', 'fountain' and so on.
export type TargetId = LandmarkId | `npc:${NpcId}` | 'fountain'

export function nearestTarget(p: Point): TargetId | null {
  const candidates: [TargetId, number][] = [
    ...landmarks.map((l): [TargetId, number] => [l.id, Math.hypot(p.x - l.x, p.z - l.z) - l.radius]),
    ...npcs.map((n): [TargetId, number] => [`npc:${n.id}`, Math.hypot(p.x - n.x, p.z - n.z) - 0.6]),
    ['fountain', Math.hypot(p.x - FOUNTAIN.x, p.z - FOUNTAIN.z) - FOUNTAIN.r],
  ]
  let best: TargetId | null = null
  let bestDistance = INTERACT_RANGE
  for (const [id, distance] of candidates) {
    // People need to be approached a bit closer than buildings.
    const range = id.startsWith('npc:') ? 2.2 : INTERACT_RANGE
    if (distance < range && distance < bestDistance) {
      best = id
      bestDistance = distance
    }
  }
  return best
}
