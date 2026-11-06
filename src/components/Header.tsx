import { Link } from 'react-router-dom'
import { profile } from '../content'

export default function Header() {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label={`${profile.name}, home`}>
        <span className="wordmark-full">{profile.name}</span>
        <span className="wordmark-short" aria-hidden="true">
          VB
        </span>
      </Link>
      <nav aria-label="Quick links">
        <Link to="/#projects">Projects</Link>
        <Link to="/#experience">Experience</Link>
        {profile.resumeUrl && <a href={profile.resumeUrl}>Résumé</a>}
        <Link to="/#contact">Contact</Link>
      </nav>
    </header>
  )
}
