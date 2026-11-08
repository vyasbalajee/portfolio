import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { profile } from '../content'

type Turn = { question: string; answer: string; failed?: boolean }

const suggestions = [
  'What has Vyas built?',
  'What is his backend experience?',
  'Is he open to internships?',
]

const failures: Record<string, string> = {
  'not-configured': "The chat isn't switched on yet.",
  'rate-limited': "You've asked a lot of questions in a short time. Try again in a few minutes.",
  busy: 'The chat is busy right now. Try again in a moment.',
  error: 'Something went wrong answering that.',
}

type ChatControls = { open: (greeting?: string) => void }
const ChatContext = createContext<ChatControls>({ open: () => {} })
export const useChat = () => useContext(ChatContext)

// Turns site paths like /work/chess-engine in answers into links.
function Answer({ text }: { text: string }) {
  const parts = text.split(/(\/(?:work\/[a-z0-9-]+|#[a-z]+))/g)
  return (
    <>
      {parts.map((part, i) =>
        /^\/(work\/|#)/.test(part) ? (
          <Link key={i} to={part}>
            {part}
          </Link>
        ) : (
          part
        ),
      )}
    </>
  )
}

async function ask(question: string, history: Turn[], onText: (text: string) => void) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history: history.filter((t) => !t.failed) }),
  })
  const type = response.headers.get('Content-Type') ?? ''
  if (!response.ok || !type.startsWith('text/plain')) {
    const code = type.startsWith('text/plain') ? await response.text() : 'not-configured'
    throw new Error(code in failures ? code : 'error')
  }
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
    onText(text)
  }
  const trailer = text.match(/\n\[(busy|error)\]$/)
  if (trailer) throw new Error(trailer[1])
  return text
}

function ChatPanel({ greeting, onClose }: { greeting: string | null; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const log = useRef<HTMLDivElement>(null)

  useEffect(() => input.current?.focus(), [])
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [turns])

  const submit = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) {
      setError('Type a question first.')
      return
    }
    if (pending) return
    setError('')
    setDraft('')
    setPending(true)
    const history = turns
    setTurns([...history, { question: trimmed, answer: '' }])
    const update = (answer: string, failed = false) =>
      setTurns((current) => [...current.slice(0, -1), { question: trimmed, answer, failed }])
    try {
      await ask(trimmed, history, (text) => update(text))
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : 'error'
      update(failures[code] ?? failures.error, true)
    } finally {
      setPending(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit(draft)
  }

  return (
    <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header className="chat-header">
        <h2 id="chat-title">Ask about {profile.name.split(' ')[0]}</h2>
        <button type="button" className="chat-close" onClick={onClose} aria-label="Close chat">
          ×
        </button>
      </header>
      <div className="chat-log" ref={log} aria-live="polite">
        <p className="chat-answer">
          {greeting ??
            "Hi! I can answer questions about Vyas's projects, experience, and skills, using only what's on this site."}
        </p>
        {turns.map((turn, i) => (
          <div key={i}>
            <p className="chat-question">{turn.question}</p>
            <p className={turn.failed ? 'chat-answer chat-failed' : 'chat-answer'}>
              {turn.answer ? <Answer text={turn.answer} /> : <span className="chat-typing">Thinking…</span>}
              {turn.failed && (
                <>
                  {' '}
                  You can always <a href={`mailto:${profile.email}`}>email Vyas</a>.
                </>
              )}
            </p>
          </div>
        ))}
        {turns.length === 0 && (
          <div className="chat-suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => void submit(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          Your question
        </label>
        <input
          id="chat-input"
          ref={input}
          value={draft}
          maxLength={500}
          placeholder="What did Vyas build at Etalvis?"
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value)
            setError('')
          }}
        />
        <button type="submit" className="button button-primary" disabled={pending}>
          Ask
        </button>
      </form>
      {error && <p className="chat-error">{error}</p>}
      <p className="chat-note">Answers are AI-generated from this site and can be wrong.</p>
    </section>
  )
}

export function ChatProvider({ children, showLauncher }: { children: ReactNode; showLauncher: boolean }) {
  const [state, setState] = useState<{ open: boolean; greeting: string | null }>({ open: false, greeting: null })
  const open = useCallback((greeting?: string) => setState({ open: true, greeting: greeting ?? null }), [])

  useEffect(() => {
    if (!state.open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setState((s) => ({ ...s, open: false }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.open])

  return (
    <ChatContext.Provider value={{ open }}>
      {children}
      {state.open ? (
        <ChatPanel greeting={state.greeting} onClose={() => setState((s) => ({ ...s, open: false }))} />
      ) : (
        showLauncher && (
          <button type="button" className="chat-launcher" onClick={() => open()}>
            Ask about Vyas
          </button>
        )
      )}
    </ChatContext.Provider>
  )
}
