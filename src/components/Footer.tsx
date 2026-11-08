import { Link } from 'react-router-dom'
import { profile } from '../content'

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>
        {profile.name}, {profile.location}
      </span>
      <Link to="/world">Explore the sky kingdom →</Link>
    </footer>
  )
}
