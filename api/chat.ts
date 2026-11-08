import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '../src/chat/knowledge'

// Vercel serverless function: answers questions about Vyas, streaming plain text back.

const MAX_QUESTION = 500
const MAX_TURNS = 6
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 12

// Best-effort, per-instance limit. The hard cost ceiling is the spend limit on the API key.
const recent = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const hits = (recent.get(ip) ?? []).filter((time) => now - time < WINDOW_MS)
  hits.push(now)
  recent.set(ip, hits)
  return hits.length > MAX_PER_WINDOW
}

type Turn = { question: string; answer: string }

function parseBody(body: unknown): { question: string; history: Turn[] } | null {
  if (!body || typeof body !== 'object') return null
  const { question, history } = body as { question?: unknown; history?: unknown }
  if (typeof question !== 'string' || !question.trim() || question.length > MAX_QUESTION) return null
  const turns = Array.isArray(history) ? history : []
  return {
    question: question.trim(),
    history: turns
      .filter((t): t is Turn => typeof t?.question === 'string' && typeof t?.answer === 'string')
      .slice(-MAX_TURNS)
      .map((t) => ({ question: t.question.slice(0, MAX_QUESTION), answer: t.answer.slice(0, 1500) })),
  }
}

function message(status: number, text: string) {
  return new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return message(503, 'not-configured')

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (rateLimited(ip)) return message(429, 'rate-limited')

  const input = parseBody(await request.json().catch(() => null))
  if (!input) return message(400, 'bad-request')

  // Each request is one self-contained user message, with recent turns quoted as context.
  const context = input.history.length
    ? `Earlier in this conversation:\n${input.history.map((t) => `Visitor: ${t.question}\nYou: ${t.answer}`).join('\n\n')}\n\nNew question: `
    : ''

  const client = new Anthropic()
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5-5',
    max_tokens: 1024,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `${context}${input.question}` }],
  })

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        const final = await stream.finalMessage()
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode("Sorry, I can't help with that. Ask me about Vyas's work instead."))
        }
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) {
          controller.enqueue(encoder.encode('\n[busy]'))
        } else {
          console.error('chat failed', error instanceof Anthropic.APIError ? error.status : error)
          controller.enqueue(encoder.encode('\n[error]'))
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
