import { DataTexture, NearestFilter, RedFormat } from 'three'

// Three flat bands of light give the cel-shaded anime look.
export const gradient = new DataTexture(new Uint8Array([110, 185, 255]), 3, 1, RedFormat)
gradient.minFilter = NearestFilter
gradient.magFilter = NearestFilter
gradient.needsUpdate = true

export default function Toon({ color }: { color: string }) {
  return <meshToonMaterial color={color} gradientMap={gradient} />
}
