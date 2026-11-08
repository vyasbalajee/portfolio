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

export type House = Point & {
  rotation: number
  width: number
  depth: number
  height: number
  wall: string
  roof: string
}

export type Tree = Point & { kind: 'pine' | 'blossom'; scale: number }

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

export const paths: [Point, Point][] = [[SPAWN, FOUNTAIN], ...landmarks.map((l): [Point, Point] => [FOUNTAIN, l])]

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

function isOpenGround(p: Point, clearance: number) {
  return (
    !landmarks.some((l) => Math.hypot(p.x - l.x, p.z - l.z) < l.radius + clearance + 2) &&
    !paths.some(([a, b]) => distanceToSegment(p, a, b) < clearance + 1.8) &&
    Math.hypot(p.x - FOUNTAIN.x, p.z - FOUNTAIN.z) > FOUNTAIN.r + clearance + 3
  )
}

const wallColors = ['#f4e7cf', '#efd9c0', '#f6efe2', '#e9d6bd']
const roofColors = ['#d9534f', '#c8443f', '#4b6fb5', '#3f8f86', '#d9534f']

function buildHouses() {
  const random = seeded(7)
  const houses: House[] = []
  for (let attempt = 0; attempt < 1200 && houses.length < 54; attempt++) {
    const angle = random() * Math.PI * 2
    const distance = 12 + random() * 31
    const spot = { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
    if (!isOpenGround(spot, 2.6)) continue
    if (houses.some((h) => Math.hypot(h.x - spot.x, h.z - spot.z) < 5.4)) continue
    houses.push({
      ...spot,
      rotation: Math.round(random() * 4) * (Math.PI / 2) + (random() - 0.5) * 0.3,
      width: 2.8 + random() * 1.6,
      depth: 2.8 + random() * 1.4,
      height: 2.4 + random() * 1.8,
      wall: wallColors[Math.floor(random() * wallColors.length)],
      roof: roofColors[Math.floor(random() * roofColors.length)],
    })
  }
  return houses
}

function buildTrees(houses: House[]) {
  const random = seeded(21)
  const trees: Tree[] = []
  for (let attempt = 0; attempt < 1500 && trees.length < 70; attempt++) {
    const angle = random() * Math.PI * 2
    const distance = 9 + random() * 37
    const spot = { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
    if (!isOpenGround(spot, 0.8)) continue
    if (houses.some((h) => Math.hypot(h.x - spot.x, h.z - spot.z) < 3.4)) continue
    if (trees.some((t) => Math.hypot(t.x - spot.x, t.z - spot.z) < 2.2)) continue
    trees.push({ ...spot, kind: random() < 0.45 ? 'blossom' : 'pine', scale: 0.85 + random() * 0.5 })
  }
  return trees
}

export const houses = buildHouses()
export const trees = buildTrees(houses)

const colliders: Collider[] = [
  FOUNTAIN,
  ...landmarks.map((l) => ({ x: l.x, z: l.z, r: l.solid })),
  ...houses.map((h) => ({ x: h.x, z: h.z, r: Math.max(h.width, h.depth) * 0.6 })),
  ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.5 })),
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

export function nearestLandmark(p: Point) {
  let best: Landmark | null = null
  let bestDistance = Infinity
  for (const l of landmarks) {
    const distance = Math.hypot(p.x - l.x, p.z - l.z) - l.radius
    if (distance < INTERACT_RANGE && distance < bestDistance) {
      best = l
      bestDistance = distance
    }
  }
  return best
}
