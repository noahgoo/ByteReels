# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**M1 ✅ M2 ✅ M3 ✅** — Scaffold, data layer, and feed UI are complete. See `PRD.md` for the full milestone table.

## Platform Target

**Primary: iPhone, iOS Safari 15.4+, installed as a PWA.** Every UI and performance decision should be optimised for this context first. Desktop is secondary.

Key constraints this imposes on all new code:
- Use `100dvh` (not `100vh`) for full-screen layouts — Safari's collapsing toolbar requires dynamic viewport units
- Touch targets must be ≥ 44px tall (Apple HIG minimum)
- Avoid hover-only interactions — everything must be tappable
- `playsinline: 1` is required on all YouTube embeds — without it iOS Safari fullscreens the video
- iOS Safari blocks `player.playVideo()` without a prior user gesture — a tap-to-play overlay is required on the active card (planned for M6)
- No `beforeinstallprompt` on iOS — a manual "Add to Home Screen" banner is needed (planned for M6)
- Test scroll performance on a real device or Xcode Simulator — jsdom and Chrome DevTools mobile emulation do not replicate iOS jank

## Planned Stack

- **Framework:** React 18 + Vite
- **State:** Zustand (`feedStore.js`)
- **Styling:** Tailwind CSS
- **PWA:** `vite-plugin-pwa` (Workbox) — cache-first for static assets, network-first for API
- **Gestures:** `react-swipeable`
- **Data:** YouTube Data API v3 (no backend for v1)
- **Persistence:** LocalStorage (watch history, video progress, active filter)
- **Deployment:** Vercel (`VITE_YOUTUBE_API_KEY` env var)

## Development Commands (once scaffolded)

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview production build locally
npm run lint      # ESLint
```

## Testing

**Approach: test-first, then implement.** For every new module or feature, write the tests before writing the implementation. Iterate on the implementation until all tests pass before moving on.

**Stack:** Vitest + React Testing Library + jsdom

```bash
npm run test           # watch mode (use during development)
npm run test:run       # single pass, no watch (use in CI or to verify)
npx vitest run src/api/youtube.test.js   # run a single test file
```

**`vite.config.js` test config:**
```js
test: { environment: 'jsdom', globals: true }
```

### What to test (by priority)

| Module | What to cover |
|---|---|
| `src/api/youtube.js` | `parseDuration` (ISO 8601 → seconds), `isUnderTenMinutes`, video filter logic |
| `src/store/feedStore.js` | Each Zustand action: `setVideos`, `setFilter`, initial state shape |
| `src/hooks/useWatchHistory.js` | Mark started, mark watched, clear history — mock `localStorage` |
| `src/hooks/useVideoProgress.js` | Save and restore timestamps — mock `localStorage` |
| `src/data/channels.json` | Tag union logic that populates FilterBar chips |
| Components | FilterBar chip rendering, VideoCard watched state indicator |

### What NOT to test

- Raw `fetch` calls to the YouTube API — mock the API client, test the transform logic instead
- YouTube IFrame behavior and swipe gestures — verify manually or with Playwright e2e
- Service worker / PWA install logic

### TDD workflow

1. Write a failing test that describes the expected behavior
2. Implement the minimum code to make it pass
3. Refactor if needed, keeping tests green
4. Do not proceed to the next module until all tests for the current one pass

## Architecture

Two routes only: `/` (feed) and `/settings`. No complex routing needed.

**Data flow:**
1. App boots → reads `src/data/channels.json` (curated channel IDs + tags)
2. Calls `youtube.search.list` per channel (both `short` and `medium` duration buckets)
3. Calls `videos.list?part=contentDetails` to get ISO 8601 durations, then filters client-side to < 600 seconds (10 min)
4. API responses cached in `sessionStorage` — no re-fetch until next app open
5. Zustand store holds normalised video list, active filter, and pagination cursor
6. UI merges API data with LocalStorage watch state on render

**YouTube API quota:** `search.list` costs 100 units/call; `videos.list` costs 1 unit/call. Free tier is 10,000 units/day — keep `maxResults` per channel low (default: 10 in `channels.json`).

**Duration filtering:** YouTube's `videoDuration` param only has coarse buckets. Fetch both `short` (< 4 min) and `medium` (4–20 min), then discard anything ≥ 600 seconds after calling `videos.list`.

## Known Setup Notes

- **ESLint JSX:** `eslint.config.js` must include `languageOptions.parserOptions.ecmaFeatures.jsx: true` — the default `@eslint/js` config does not enable JSX parsing. The `globals` package is also required for `globals.browser`.
- **Testing peer deps:** `@testing-library/dom` must be installed explicitly (peer dep of `@testing-library/react`).
- **Zustand test isolation:** `feedStore.js` exports `useFeedStore.getInitialState()` so tests can call `useFeedStore.setState(useFeedStore.getInitialState())` in `beforeEach` to reset state between tests.
- **React version:** The scaffold uses React 19 (not 18 as listed in the PRD).

## Key Files

| File | Purpose |
|---|---|
| `src/api/youtube.js` | YouTube Data API client — `parseDuration`, `filterVideos`, `fetchVideosForChannel`, `fetchAllVideos` |
| `src/store/feedStore.js` | Zustand store: `videos`, `activeFilter`, `cursor` + actions |
| `src/data/channels.json` | Curated channel IDs + tags (schema in PRD §6.2) |
| `src/hooks/useWatchHistory.js` | LocalStorage read/write for watch history *(M5)* |
| `src/hooks/useVideoProgress.js` | LocalStorage read/write for per-video timestamps *(M5)* |
| `.env.local` | `VITE_YOUTUBE_API_KEY` — never commit this |

## LocalStorage Schema

```json
{
  "watchHistory": ["videoId1", "videoId2"],
  "videoProgress": { "videoId1": 142 },
  "activeFilter": "react"
}
```

## channels.json Schema

```json
{
  "channels": [
    { "id": "UCVhQ2NnY5Rskt6UjCUkJ_DA", "name": "Fireship", "tags": ["web", "javascript"] }
  ]
}
```

## PWA Requirements

- `manifest.json`: `display: standalone`, `orientation: portrait`, theme `#0d0d0d`
- Icons at 192px and 512px
- Service worker generated by `vite-plugin-pwa` — do not hand-write `sw.js`
- Offline state: show cached video list + "you're offline" banner
- **iOS install:** No `beforeinstallprompt` — show a dismissible banner with "Tap Share → Add to Home Screen" (M6)
- **iOS autoplay:** tap-to-play overlay on the active card until user gesture is established (M6)

## Watch History Logic

- Playing > 10 seconds → mark as "started"
- Reaching > 90% → mark as "watched" (show visual indicator on card)
- On re-open → seek IFrame to saved progress timestamp via YouTube IFrame Player API
