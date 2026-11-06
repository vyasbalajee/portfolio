import { profile } from '../content'

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>
        {profile.name}, {profile.location}
      </span>
      <span>Something bigger is being built here.</span>
    </footer>
  )
}
