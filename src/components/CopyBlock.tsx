import type { Copy } from '../content'

export function hasCopy(copy: Copy) {
  return typeof copy === 'string' || import.meta.env.DEV
}

export default function CopyBlock({ copy }: { copy: Copy }) {
  if (typeof copy === 'string') return <p>{copy}</p>
  if (!import.meta.env.DEV) return null

  return (
    <p className="gap-note">
      <strong>To fill in:</strong> {copy.gap}
    </p>
  )
}
