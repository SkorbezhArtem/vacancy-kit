# vacancy-kit

Chrome extension that lives inside hh.ru and rabota.by. Adds AI-powered helpers next to vacancy pages — one-click cover letter draft, resume audit, and a quick match score.

Work in progress. Not on the Chrome Web Store yet.

## Layout

pnpm monorepo:

```
apps/
  extension/          — MV3 Chrome extension (React + Vite + crxjs)
  api/                — Hono API (cover-letter generation, rate limit)  [WIP]
packages/
  shared/             — domain types, zod schemas, system prompts
                        consumed by both extension and api
```

## Stack

**Extension**
- Manifest V3, content scripts on `*.hh.ru` and `*.rabota.by`
- React 18 + TypeScript + Vite (`@crxjs/vite-plugin`)
- Tailwind CSS, custom shadcn-style primitives
- Zustand for in-memory state
- Shadow DOM for the injected UI so the host site's styles don't leak in

**API** (WIP)
- Hono on Node
- Google Gemini via `@ai-sdk/google` (OpenRouter fallback)
- In-memory rate limit for anon users

**Shared**
- Domain types (`Vacancy`, `CoverLetterRequest`, …)
- Zod schemas matching the types — used by the API for request validation and by the extension for response validation
- System prompts for cover-letter generation (ru/en)

## Develop

Install everything from the repo root:

```bash
pnpm install
```

Run the extension dev server:

```bash
pnpm dev
# or
pnpm --filter @vacancy-kit/extension dev
```

Then in Chrome: `chrome://extensions` → enable Developer mode → "Load unpacked" → pick `apps/extension/dist/`. Vite watches and rebuilds; reload the extension after major changes.

Run the API locally (when it's wired up):

```bash
pnpm --filter @vacancy-kit/api dev
```

## Build

```bash
pnpm build
```

Builds every workspace. Extension output lands in `apps/extension/dist/`.

## Notes

- Extension LLM calls go through the API. When `USE_MOCK` is true (`apps/extension/src/shared/api.ts`), the extension uses a local deterministic mock instead of hitting the backend — handy for offline UI work.
- Parsers are intentionally tolerant — hh.ru ships layout tweaks often, so each parser falls back through 2–3 selectors before giving up.
- All cross-app contracts (types, schemas, prompts) live in `packages/shared/`. Edit them there, both sides pick up the change on rebuild.
