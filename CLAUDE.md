# Vyas Balajee portfolio

Personal portfolio. React + Vite + TypeScript, hosted on Vercel.

## Working rules

- Do not start work without Vyas's explicit go-ahead.
- Every piece of work gets committed and pushed to https://github.com/vyasbalajee/portfolio.

## Content rules

- Positioning order: software developer and backend engineer first, builder second.
- All site copy lives in `src/content.ts`. Use only facts Vyas has provided; never invent them.
- Missing facts use `gap()`: visible in dev, hidden in production builds, and tracked in `GAPS.md`.
- Keep the phone number off the site and out of any published résumé.
- SkipCourse: publish only sponsor-approved material (the current case study copy and the published résumé).

## Roadmap

1. Quick View site with real content (done).
2. Explorable anime sky kingdom at golden hour: third-person hero, walled city, project landmarks, mini map.
   Live at `/world` (`src/world/`), using CC0 models (see `CREDITS.md`).
3. AI chat answering only from Vyas's info, NPC dialogue, ambient music (off by default), day/night cycle, easter eggs.
   Built. The chat (`api/chat.ts`, `src/chat/`) needs `ANTHROPIC_API_KEY` set in Vercel by Vyas.

## AI chat rules

- Grounded only in `src/content.ts` via `src/chat/knowledge.ts`; gaps are never sent to the model.
- Uses `claude-opus-5-5` at low effort with short answers. Cost ceiling is the spend limit on the API key.
