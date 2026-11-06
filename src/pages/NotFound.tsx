import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">404</p>
      <h1>This page isn't on the map.</h1>
      <Link className="button button-primary" to="/">
        Back to home
      </Link>
    </section>
  )
}
