export type Gap = { gap: string }
// A string is prose (blank lines start new paragraphs); an array is a bullet list.
export type Copy = string | string[] | Gap

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
  title: 'Software Developer & Backend Engineer',
  roles: 'Software developer · Backend engineer',
  location: 'Tempe, AZ',
  tagline: 'Backend engineer building reliable software, from the database to the interface.',
  intro:
    'Sole developer of a production quiz platform, backend developer on an AI assessment platform, and a Computer Science student at Arizona State University.',
  availability: 'Open to backend, software engineering, and full-stack roles, including new grad and internships.',
  email: 'vyasbalaje@gmail.com',
  linkedin: 'https://www.linkedin.com/in/vyas-balajee-7aba9229a',
  github: 'https://github.com/vyasbalajee',
  // Must never contain the phone number.
  resumeUrl: '/Resume_Vyas_Balajee.pdf' as string | null,
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
    problem:
      'Etalvis had a large bank of electronics, C, embedded systems, and 8085 questions locked inside PowerPoint decks. The restyle alone covered more than 1,300 slides. Instructors had no way to randomize questions per student, control difficulty, or see who answered what.\n\n' +
      "Off-the-shelf tools like Google Forms and Moodle didn't fit. The questions depend on diagrams, and the courses needed difficulty-tiered quizzes from level 1 to 10, per-topic readiness rules, and role-gated admin and instructor views.",
    built: [
      'A quiz engine with randomized and topic-based modes, a 1–10 difficulty scale, timed sessions, per-question timing, and mid-quiz resume.',
      'JWT authentication with bcrypt, email OTP, and rate limiting.',
      'GitHub-style role-based access control with role presets, per-user permission overrides, and permission-gated API middleware.',
      'Automated operations: GitHub Actions cleanup of orphaned images, database backups, secret rotation, and versioned releases.',
    ],
    hardest:
      'Running it safely in production was harder than building the features. That meant a full secret rotation across every service, from the GitHub token and JWT signing key to the image, email, admin, and database credentials.\n\n' +
      'Keeping images in sync with the database was the other challenge. Deleted questions left orphaned images in Cloudinary, so I started storing each image\'s public_id, deleting the image along with its question, and running a weekly sweep that protects older images.',
    decisions: [
      "Topic quizzes are locked when a session starts. Questions are fixed at creation, so resuming a quiz can't re-roll it.",
      "Correct answers are stored as labels, not positions, so shuffling the options can't corrupt grading.",
      'A topic is quiz-ready only when all 10 difficulty levels have at least one question.',
      'Timestamps are stored with time zones and shown in India Standard Time.',
      'Tests gate deploys: Jest and the frontend build must pass before Railway deploys.',
      'The database is backed up automatically every day.',
      'Real role-gated routes replaced the old state-based screen switching.',
    ],
    change: [
      'Turn on secret scanning from day one.',
      'Store question diagrams with transparent backgrounds, so the diagram box no longer has to stay light in dark mode.',
      'Build a bulk importer early. Questions arrive as PowerPoint slides, and the Python upload script is still on the to-do list.',
      'Write tests beyond the permission model, which is the only part CI tests today.',
    ],
    outcome: gap('Add verified numbers, such as the size of the question bank, users, or quizzes taken.'),
  },
  {
    slug: 'ai-assessment-platform',
    name: 'SkipCourse AI assessment platform',
    role: 'Backend developer, ASU capstone',
    period: 'Sep 2026 – Present',
    summary:
      "Backend work on an AI platform that turns students' existing work into recognised evidence of learning.",
    stack: ['Python', 'Neo4j', 'Google Cloud', 'Gemini API'],
    stats: [
      { value: '222,340', label: 'records verified' },
      { value: '52', label: 'jurisdictions covered' },
      { value: '214', label: 'frameworks checked' },
    ],
    links: [],
    problem:
      "SkipCourse helps students turn the work they've already done, such as projects, code, essays, and reports, into recognised evidence of learning. It assesses submissions against academic standards and builds a portfolio students can share with teachers and other institutions.",
    built: [
      'A Python data-validation pipeline of about 70 checks that verified 222,340 curriculum-standard records before import.',
      'An "academic intensity" scoring method for the AI pre-processor that decides which files in a submission get graded first.',
      'A breakdown of that upgrade into 53 tasks across 5 engineers, with interface contracts between them.',
    ],
    hardest:
      'Working out which parts of a large, messy submission actually show learning. A student might upload a whole project: hundreds of files, including generated code, duplicates, configuration, and style sheets. Grading all of it is slow and expensive, and the noise drowns out the real work.\n\n' +
      'We had to pick out the strongest evidence reliably, explain why we picked it, and stay within a sensible cost per submission, while five of us built separate parts of the pipeline at the same time.',
    decisions:
      'For large submissions we chose to rank, not reject. Instead of capping uploads or dropping big files, every file is scored for academic intensity: 70% depth of thinking and 30% alignment to subject areas. That happens in one batched AI call, with a plain-language reason for each score that the student can see.\n\n' +
      'The ranking only decides what gets graded first, so nothing a student submits is thrown away. For oversized files we borrowed ideas from how web crawlers index the internet: fingerprinting files to skip duplicates, and splitting long documents into labelled parts rather than cutting them off.',
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
