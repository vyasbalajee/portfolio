import type { Copy } from '../content'

export function hasCopy(copy: Copy) {
  return !('gap' in Object(copy)) || import.meta.env.DEV
}

export default function CopyBlock({ copy }: { copy: Copy }) {
  if (typeof copy === 'string') {
    return copy.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)
  }

  if (Array.isArray(copy)) {
    return (
      <ul>
        {copy.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }

  if (!import.meta.env.DEV) return null

  return (
    <p className="gap-note">
      <strong>To fill in:</strong> {copy.gap}
    </p>
  )
}
