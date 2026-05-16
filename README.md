# vacancy-kit

Chrome extension that lives inside hh.ru and rabota.by. Adds AI-powered helpers next to vacancy pages — one-click cover letter draft, resume audit, and a quick match score.

Work in progress. Not on the Chrome Web Store yet.

## Stack

- Manifest V3, content scripts on `*.hh.ru` and `*.rabota.by`
- React 18 + TypeScript + Vite (`@crxjs/vite-plugin`)
- Tailwind CSS, custom shadcn-style primitives
- Zustand for in-memory state
- Shadow DOM for the injected UI so the host site's styles don't leak in

## Develop

```bash
pnpm install
pnpm dev
```

Then in Chrome: `chrome://extensions` → enable Developer mode → "Load unpacked" → pick the `dist/` folder. Vite watches and rebuilds; reload the extension after major changes.

## Build

```bash
pnpm build
```

Output goes to `dist/`. Zip the contents for store upload.

## Layout

```
src/
  popup/        — toolbar popup (account, quotas)
  content/      — injected UI + per-site parsers
    parsers/    — hh.ru and rabota.by DOM readers
    ui/        — shadow-root host, buttons, modal
  background/   — MV3 service worker (message router, fetches)
  shared/       — types, messages, mock LLM client
  components/ui — buttons, cards, badges
```

## Notes

- LLM calls are mocked for now (`src/shared/llm/mock.ts`). Real provider (DeepSeek / Gemini) wires in when the backend is up.
- Parsers are intentionally tolerant — hh.ru ships layout tweaks often, so each parser falls back through 2–3 selectors before giving up.
