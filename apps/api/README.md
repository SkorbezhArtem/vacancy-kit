# @vacancy-kit/api

Hono-based HTTP API that powers cover-letter generation and (later) resume audit / match-score for the `vacancy-kit` Chrome extension.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** [Hono](https://hono.dev) on `@hono/node-server`
- **Validation:** Zod (shared schemas from `@vacancy-kit/shared`)
- **LLM:**
  - Primary — Google Gemini via [`@ai-sdk/google`](https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai) (`gemini-2.5-flash`, free tier)
  - Fallback — OpenRouter (`deepseek/deepseek-chat:free` by default) via REST
- **Deploy:** Dockerfile + `fly.toml` for fly.io

## Quickstart

```bash
# from repo root
pnpm install
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env and set at least GEMINI_API_KEY or OPENROUTER_API_KEY

pnpm --filter @vacancy-kit/api dev
```

Server listens on `http://localhost:8000` by default.

## Routes

| Method | Path | Notes |
|---|---|---|
| GET | `/` | banner |
| GET | `/health` | uptime |
| GET | `/version` | name + version + commit |
| POST | `/api/v1/generations/cover-letter` | rate-limited cover-letter generation |

### `POST /api/v1/generations/cover-letter`

Request body — validated by `CoverLetterRequestSchema` from `@vacancy-kit/shared`:

```json
{
  "vacancy": {
    "id": "12345",
    "site": "hh",
    "title": "Frontend Engineer",
    "company": "Acme",
    "url": "https://hh.ru/vacancy/12345",
    "description": "Looking for a senior FE…",
    "skills": ["React", "TypeScript"]
  },
  "resume": {
    "title": "Senior Frontend Engineer",
    "summary": "8 years of React…",
    "skills": ["React", "TypeScript", "Vite"],
    "experience": [{ "company": "Foo", "role": "FE", "years": "2022—now" }]
  },
  "language": "ru",
  "tone": "neutral"
}
```

Headers:

- `x-anon-id: <16-64 char string>` — identifies the anonymous client for rate limiting. Falls back to client IP when absent.

Response (200):

```json
{
  "text": "Добрый день…",
  "highlights": ["…", "…", "…"],
  "generatedAt": "2026-05-17T12:34:56.000Z",
  "model": "gemini-2.5-flash",
  "cached": false
}
```

Rate limit response (429):

```json
{
  "error": "rate_limited",
  "message": "Free quota exceeded for today. Try again later or upgrade.",
  "resetsAt": "2026-05-18T12:34:56.000Z"
}
```

Every response carries `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset` headers.

## Environment

See [`.env.example`](./.env.example) for the full list. Variables are validated at startup by `src/env.ts` (zod).

Minimum to run the cover-letter route:

- `GEMINI_API_KEY` — get one at https://aistudio.google.com/apikey (free, no card), **or**
- `OPENROUTER_API_KEY` — get one at https://openrouter.ai/keys (free models available)

If both are set and `LLM_PROVIDER=auto` (default), Gemini is tried first with OpenRouter as fallback on retryable failures.

## Scripts

| Command | Description |
|---|---|
| `pnpm --filter @vacancy-kit/api dev` | tsx watch, hot reload |
| `pnpm --filter @vacancy-kit/api build` | tsc → `dist/` |
| `pnpm --filter @vacancy-kit/api start` | run `dist/index.js` |
| `pnpm --filter @vacancy-kit/api typecheck` | tsc --noEmit |
| `pnpm --filter @vacancy-kit/api lint` | eslint |

## Deploy

```bash
# one-time
fly launch --no-deploy --copy-config --config apps/api/fly.toml
fly secrets set GEMINI_API_KEY=...

# every time
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile .
```

The Dockerfile is built from the **repo root** so the workspace dependency on `@vacancy-kit/shared` resolves.
