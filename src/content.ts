export type Gap = { gap: string }
export type Copy = string | Gap

const gap = (prompt: string): Gap => ({ gap: prompt })

export type Project = {
  slug: string
  name: string
  role: string
  period: string
  summary: string
  stack: string[]
  stats: { value: string; label: string }[]
  links: { label: string; href: string }[]
  problem: Copy
  built: string[]
  hardest: Copy
  decisions: Copy
  change: Copy
  outcome: Copy
}

export const profile = {
  name: 'Vyas Balajee',
  title: 'Builder',
  location: 'Tempe, AZ',
  tagline: 'I build software that ships, from the database to the interface.',
  intro:
    'Sole developer of a production quiz platform, backend developer on an AI assessment platform, and a Computer Science student at Arizona State University.',
  availability: 'Open to full-stack, backend, and new grad or internship roles.',
  email: 'vyasbalaje@gmail.com',
  linkedin: 'https://www.linkedin.com/in/vyas-balajee-7aba9229a',
  github: 'https://github.com/vyasbalajee',
  // Set to a path in public/ once a résumé without the phone number is added.
  resumeUrl: null as string | null,
}

export const projects: Project[] = [
  {
    slug: 'etalvis-quiz-platform',
    name: 'Etalvis quiz platform',
    role: 'Sole full-stack developer',
    period: 'May 2025 – Present',
    summary:
      'A production quiz platform with a custom quiz engine, secure accounts, and fine-grained permissions, serving live users.',
    stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Railway', 'GitHub Actions'],
    stats: [
      { value: '1', label: 'developer, start to finish' },
      { value: '1–10', label: 'difficulty scale' },
      { value: 'Every push', label: 'runs through CI/CD' },
    ],
    links: [{ label: 'Visit the live platform', href: 'https://test.etalvis.com' }],
    problem: gap('What problem did Etalvis need solved, and why build a custom platform?'),
    built: [
      'A quiz engine with randomized and topic-based modes, a 1–10 difficulty scale, timed sessions, per-question timing, and mid-quiz resume.',
      'JWT authentication with bcrypt, email OTP, and rate limiting.',
      'GitHub-style role-based access control with role presets, per-user permission overrides, and permission-gated API middleware.',
      'Automated operations: GitHub Actions cleanup of orphaned images, database backups, secret rotation, and versioned releases.',
    ],
    hardest: gap('What was the hardest part of the build, and how did you solve it?'),
    decisions: gap('Which technical decisions were you most deliberate about, and why?'),
    change: gap('What would you change if you built it again?'),
    outcome: gap('Add any results you can share, such as users, quizzes taken, or uptime.'),
  },
  {
    slug: 'ai-assessment-platform',
    name: 'SkipCourse AI assessment platform',
    role: 'Backend developer, ASU capstone',
    period: 'Sep 2026 – Present',
    summary:
      'Backend work on an AI learning-assessment platform, including the data validation behind its curriculum standards.',
    stack: ['Python', 'Neo4j', 'Google Cloud'],
    stats: [
      { value: '222,340', label: 'records verified' },
      { value: '52', label: 'jurisdictions covered' },
      { value: '214', label: 'frameworks checked' },
    ],
    links: [],
    problem: gap('In a sentence or two you are comfortable sharing publicly, what is the platform for?'),
    built: [
      'A Python data-validation pipeline of about 70 checks that verified 222,340 curriculum-standard records before import.',
      'A breakdown of a feature upgrade into 53 tasks across 5 engineers, with interface contracts between them.',
    ],
    hardest: gap('What was hardest, at a level the sponsor is comfortable with?'),
    decisions: gap('What decision are you most proud of that can be shared publicly?'),
    change: gap('What would you do differently?'),
    outcome: gap('Add any results the sponsor is happy to share publicly.'),
  },
  {
    slug: 'chess-engine',
    name: 'Chess engine',
    role: 'Personal project',
    period: 'Fall 2024 – Present',
    summary:
      'A chess engine written in C++, moving from a handcrafted evaluation to a neural network.',
    stack: ['C++'],
    stats: [
      { value: 'C++', label: 'implementation language' },
      { value: 'Neural', label: 'evaluation in progress' },
    ],
    links: [],
    problem: gap('Why did you decide to build a chess engine?'),
    built: [
      'Board representation, legal move generation, and game-tree search.',
      'A command-line interface for playing and testing against the engine.',
      'A handcrafted evaluation using material and positional heuristics, now being replaced by a neural network evaluation.',
    ],
    hardest: gap('What was the hardest bug or design problem?'),
    decisions: gap('What search and evaluation choices did you make, and why?'),
    change: gap('What would you change, and what is next for the engine?'),
    outcome: gap('Add its strength or rating, and a GitHub link if the code is public.'),
  },
]

export const experience = [
  {
    company: 'SkipCourse',
    note: 'ASU capstone with an industry sponsor',
    role: 'Backend Developer',
    period: 'Sep 2026 – Present',
    place: 'Remote',
    points: [
      'Built a Python validation pipeline of about 70 checks covering 222,340 curriculum-standard records across 52 jurisdictions and 214 frameworks.',
      'Split a feature upgrade into 53 tasks across 5 engineers, with interface contracts.',
    ],
  },
  {
    company: 'Etalvis',
    note: null,
    role: 'Full-Stack Developer & Course Consultant',
    period: 'May 2025 – Present',
    place: 'Remote',
    points: [
      'Sole developer of a production quiz platform with CI/CD on every push.',
      'Built authentication and role-based access control, plus automated backups, secret rotation, and versioned releases.',
      'Helped launch 4 embedded systems courses by reviewing curriculum, assignments, and toolchains.',
    ],
  },
]

export const education = {
  school: 'Arizona State University',
  college: 'Ira A. Fulton Schools of Engineering',
  degree: 'B.S. Computer Science',
  gpa: '3.75 GPA',
  graduation: 'Expected May 2027',
  coursework: [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Computer Architecture',
    'Compiler Design',
    'Database Systems',
    'Machine Learning',
  ],
}

export const skills = [
  { group: 'Languages', items: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL', 'Bash'] },
  { group: 'Web and backend', items: ['React', 'Node.js', 'Express', 'REST APIs', 'JWT auth', 'HTML/CSS'] },
  { group: 'Databases', items: ['PostgreSQL', 'MySQL', 'Neo4j', 'Firestore'] },
  {
    group: 'Cloud and tools',
    items: ['Google Cloud', 'AWS', 'Docker', 'Linux', 'Git', 'GitHub Actions', 'Railway', 'CMake'],
  },
  { group: 'Machine learning', items: ['Supervised learning', 'Model training', 'NumPy', 'Gemini API'] },
]
