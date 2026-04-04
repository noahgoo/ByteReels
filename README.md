# ByteReels

A mobile-first PWA that turns your YouTube tech subscriptions into a swipeable, Reels-style feed. Surfaces short (under 10 min) educational videos from curated channels, filtered by topic — install it to your home screen and learn in focused micro-sessions.

## Stack

- React 19 + Vite
- Zustand (feed state)
- Tailwind CSS
- YouTube Data API v3
- Vitest + React Testing Library
- Deployed on Vercel

## Getting Started

```bash
npm install
```

Create `.env.local` with your YouTube API key:

```
VITE_YOUTUBE_API_KEY=your_key_here
```

Or use mock mode (zero quota cost):

```
VITE_USE_MOCK=true
```

Then run:

```bash
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test:run` | Run tests once |
| `npm run lint` | ESLint |

## CI

Tests run automatically on every push via GitHub Actions.
