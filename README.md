# Vyas Balajee portfolio

Built with React, Vite, and TypeScript.

```bash
npm install
npm run dev
```

Site copy lives in `src/content.ts`. Unfinished content is tracked in `GAPS.md`.

The "Ask about Vyas" chat is a Vercel function (`api/chat.ts`) that answers from `src/content.ts` using
Claude. It needs an `ANTHROPIC_API_KEY` environment variable in Vercel; without one it shows a friendly
"not switched on yet" message. It doesn't run under `npm run dev`.

The 3D sky kingdom lives in `src/world/`. Its models are CC0 packs (see `CREDITS.md`), compressed
into `public/models/` by `node scripts/build-models.mjs`.
