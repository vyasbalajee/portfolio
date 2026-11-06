import { useEffect, useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import Kingdom from '../components/Kingdom'
import { education, experience, profile, projects, skills } from '../content'

export default function Home() {
  const hero = useRef<HTMLElement>(null)

  useEffect(() => {
    document.title = `${profile.name} | ${profile.title}`
  }, [])

  const moveScene = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || !hero.current) return
    const { left, top, width, height } = hero.current.getBoundingClientRect()
    hero.current.style.setProperty('--px', `${(event.clientX - left) / width - 0.5}`)
    hero.current.style.setProperty('--py', `${(event.clientY - top) / height - 0.5}`)
  }

  return (
    <>
      <section className="hero" ref={hero} onPointerMove={moveScene}>
        <Kingdom />
        <div className="hero-copy">
          <p className="eyebrow">
            {profile.title} · {profile.location}
          </p>
          <h1>{profile.name}</h1>
          <p className="hero-tagline">{profile.tagline}</p>
          <p className="hero-intro">{profile.intro}</p>
          <div className="actions">
            <Link className="button button-primary" to="/#projects">
              See what I've built
            </Link>
            {profile.resumeUrl && (
              <a className="button" href={profile.resumeUrl}>
                Download résumé
              </a>
            )}
            <Link className="button" to="/#contact">
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="projects">
        <p className="eyebrow">Selected work</p>
        <h2>Projects</h2>
        <div className="project-list">
          {projects.map((project, index) => (
            <article className="project" key={project.slug}>
              <span className="project-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>
                  <Link to={`/work/${project.slug}`}>{project.name}</Link>
                </h3>
                <p className="meta">
                  {project.role} · {project.period}
                </p>
                <p>{project.summary}</p>
                <ul className="chips">
                  {project.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <span className="project-arrow" aria-hidden="true">
                →
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tint" id="experience">
        <p className="eyebrow">Where I've worked</p>
        <h2>Experience</h2>
        <div className="timeline">
          {experience.map((job) => (
            <article key={job.company}>
              <div className="timeline-head">
                <h3>{job.company}</h3>
                <p className="meta">{job.period}</p>
              </div>
              <p className="timeline-role">
                {job.role} · {job.place}
                {job.note && ` · ${job.note}`}
              </p>
              <ul>
                {job.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="about">
        <p className="eyebrow">Foundations</p>
        <h2>Education and skills</h2>
        <div className="about-grid">
          <div>
            <h3>{education.school}</h3>
            <p className="meta">{education.college}</p>
            <p>
              {education.degree} · {education.gpa} · {education.graduation}
            </p>
            <p className="coursework">{education.coursework.join(', ')}</p>
          </div>
          <dl className="skills">
            {skills.map(({ group, items }) => (
              <div key={group}>
                <dt>{group}</dt>
                <dd>{items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="contact" id="contact">
        <p className="eyebrow">Contact</p>
        <h2>Let's build something.</h2>
        <p>{profile.availability}</p>
        <div className="actions">
          <a className="button button-primary" href={`mailto:${profile.email}`}>
            Email me
          </a>
          <a className="button" href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a className="button" href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </section>
    </>
  )
}
