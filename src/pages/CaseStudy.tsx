import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import CopyBlock, { hasCopy } from '../components/CopyBlock'
import { profile, projects } from '../content'
import NotFound from './NotFound'

export default function CaseStudy() {
  const { slug } = useParams()
  const index = projects.findIndex((project) => project.slug === slug)
  const project = projects[index]

  useEffect(() => {
    if (project) document.title = `${project.name} | ${profile.name}`
  }, [project])

  if (!project) return <NotFound />

  const next = projects[(index + 1) % projects.length]
  const sections = [
    { heading: 'The problem', copy: project.problem },
    { heading: 'The hardest part', copy: project.hardest },
    { heading: 'Key decisions', copy: project.decisions },
    { heading: 'The outcome', copy: project.outcome },
    { heading: "What I'd change", copy: project.change },
  ]

  return (
    <article className="case">
      <header className="case-hero">
        <Link className="back-link" to="/#projects">
          ← All projects
        </Link>
        <p className="eyebrow">
          {project.role} · {project.period}
        </p>
        <h1>{project.name}</h1>
        <p className="hero-tagline">{project.summary}</p>
        {project.links.map(({ label, href }) => (
          <a className="button button-primary" href={href} target="_blank" rel="noreferrer" key={href}>
            {label}
          </a>
        ))}
      </header>

      <div className="case-body">
        <dl className="stats">
          {project.stats.map(({ value, label }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h2>What I built</h2>
          <ul>
            {project.built.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {sections
          .filter(({ copy }) => hasCopy(copy))
          .map(({ heading, copy }) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <CopyBlock copy={copy} />
            </section>
          ))}

        <section>
          <h2>Tech used</h2>
          <ul className="chips">
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <Link className="next-project" to={`/work/${next.slug}`}>
          <span className="eyebrow">Next project</span>
          <span>{next.name} →</span>
        </Link>
      </div>
    </article>
  )
}
