# ByteReels — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-04-04  
**Stack:** React · YouTube Data API v3 · PWA · Vercel

---

## 1. Overview

ByteReels is a mobile-first Progressive Web App that turns your YouTube tech subscriptions into a swipeable, Reels-style video feed. It surfaces short (under 10 minute) educational videos from a curated set of channels, filtered by topic, so you can learn in focused micro-sessions instead of browsing YouTube's algorithm.

---

## 2. Problem Statement

YouTube's homepage and Shorts feed are optimised for watch time, not learning. Discovering a 5-minute video that teaches exactly the thing you want to know requires either luck or deliberate searching. ByteReels removes the noise: you get a vertical swipe feed of vetted, short tech tutorials from creators you already trust.

---

## 3. Goals & Non-Goals

### Goals (v1)
- Swipeable vertical feed of short tech YouTube videos (under 10 min)
- Fetch videos from a curated, user-configured list of YouTube channels via the YouTube Data API v3
- Filter the feed by topic/tag (e.g. React, Linux, AI, Git)
- Track watch history and per-video progress locally
- Installable PWA — add to home screen, works on mobile & desktop

### Non-Goals (v1)
- Social features (comments, likes, sharing)
- User accounts / authentication (beyond YouTube OAuth for API access)
- Uploading or creating videos
- Recommendations or algorithmic ranking
- Offline video playback (videos stream from YouTube)
- YouTube Shorts (9:16 vertical videos) — v1 is 16:9 regular videos only to keep card layout consistent

---

## 4. Target User

A developer or CS student who:
- Follows 10–30 tech YouTube channels
- Learns through short-form video content
- Has limited time and wants structured micro-learning sessions
- Primarily uses the app on mobile (commute, breaks)

---

## 5. User Stories

| # | As a user I want to… | So that… |
|---|---|---|
| U1 | Swipe up through a vertical feed of tech videos | I can quickly find something worth watching |
| U2 | See only videos under 10 minutes long | I don't accidentally start a long video |
| U3 | Filter the feed by topic (React, AI, Linux…) | I can focus on what I'm learning right now |
| U4 | See which videos I've already watched | I don't re-watch content unintentionally |
| U5 | Resume a video where I left off | I don't lose my place if I swipe away |
| U6 | Install the app on my home screen | I can open it without going through a browser |
| U7 | Configure which channels appear in my feed | I only see creators I actually follow |

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ByteReels PWA                    │
│                                                     │
│  ┌─────────────┐    ┌───────────────────────────┐  │
│  │ channels.json│───▶│  YouTube Data API v3      │  │
│  │ (local config)│   │  (search + videos.list)   │  │
│  └─────────────┘    └───────────┬───────────────┘  │
│                                 │                   │
│  ┌──────────────────────────────▼─────────────────┐ │
│  │              Video Feed Store                  │ │
│  │  (React Context / Zustand — normalised video   │ │
│  │   list, active filters, pagination cursor)     │ │
│  └────────────────────┬───────────────────────────┘ │
│                       │                             │
│  ┌────────────────────▼───────────────────────────┐ │
│  │              Feed UI (React)                   │ │
│  │  SwipeFeed → VideoCard → YouTubeEmbed          │ │
│  │  FilterBar → TagChips                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  LocalStorage: watch history, video progress,       │
│                  last active filter                 │
└─────────────────────────────────────────────────────┘
```

### 6.1 Data Flow

1. App boots → reads `channels.json` (curated channel IDs + tags)
2. For each channel, calls `youtube.search.list` filtered to `videoDuration=short` (< 4 min) and `medium` (4–20 min) — post-filters to under 10 min client-side using `videos.list` duration data
3. Normalised video list is stored in app state (React Context or Zustand)
4. UI renders the swipe feed, merging API data with LocalStorage watch state

### 6.2 channels.json Schema

```json
{
  "channels": [
    {
      "id": "UCVhQ2NnY5Rskt6UjCUkJ_DA",
      "name": "Fireship",
      "tags": ["web", "javascript", "career"]
    },
    {
      "id": "UC8butISFwT-Wl7EV0hUK0BQ",
      "name": "freeCodeCamp",
      "tags": ["python", "web", "algorithms"]
    }
  ]
}
```

### 6.3 LocalStorage Schema

```json
{
  "watchHistory": ["videoId1", "videoId2"],
  "videoProgress": { "videoId1": 142 },
  "activeFilter": "react"
}
```

---

## 7. Feature Specifications

### 7.1 Vertical Swipe Feed

- Full-viewport cards, one video per card
- Swipe up → next video, swipe down → previous video
- On desktop: scroll wheel / keyboard arrow support
- YouTube IFrame Player API embedded in each card
- Autoplay the video when a card is fully in view (IntersectionObserver)
- Pause when card leaves the viewport

**Card anatomy:**
```
┌─────────────────────────┐
│                         │
│    YouTube IFrame       │
│    (16:9, centred)      │
│                         │
├─────────────────────────┤
│ 🔵 Channel avatar       │
│ Video title (2 lines)   │
│ Duration · X days ago   │
│ [tag] [tag]             │
└─────────────────────────┘
```

### 7.2 Topic Filter Bar

- Horizontal scrollable chip row pinned below the header
- Tags are auto-generated from `channels.json` (union of all channel tags)
- "All" chip is always first and selected by default
- Selecting a tag filters the feed to videos from channels with that tag
- Active filter persisted to LocalStorage

### 7.3 Watch History & Progress

- When a video plays > 10 seconds, mark it as "started" in LocalStorage
- When a video reaches > 90% completion, mark it as "watched"
- Watched cards show a subtle visual indicator (e.g. greyed title, checkmark)
- On re-open, seek the IFrame to the saved progress timestamp
- "Clear history" option in a settings drawer

### 7.4 PWA / Installability

- `manifest.json` with app name, icons (192px, 512px), `display: standalone`, `orientation: portrait`
- Service worker via Vite PWA plugin (`vite-plugin-pwa`)
- Cache strategy: Cache-first for static assets, network-first for API responses
- Offline state: show cached video list with a "you're offline" banner
- Theme colour: dark (`#0d0d0d`) to match video player aesthetic

---

## 8. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast dev experience, great PWA tooling |
| State | Zustand | Lightweight, no boilerplate for this scale |
| Styling | Tailwind CSS | Utility-first, great for mobile layouts |
| PWA | vite-plugin-pwa (Workbox) | Zero-config service worker generation |
| Video | YouTube IFrame Player API | No transcoding, no hosting costs |
| Data fetching | YouTube Data API v3 | Channel video lists, duration metadata |
| Persistence | LocalStorage | No backend required for v1 |
| Gestures | `react-swipeable` | Cross-platform touch + mouse swipe |
| Deployment | Vercel | One-command deploy, free tier, edge CDN |

---

## 9. YouTube API Details

### Endpoints Used

| Endpoint | Purpose |
|---|---|
| `search.list` | Fetch recent videos for a channel (filter: `type=video`) |
| `videos.list` | Fetch duration + stats for a batch of video IDs |

### Duration Filtering Strategy

YouTube's `videoDuration` param only supports coarse buckets (`short` < 4 min, `medium` 4–20 min). To get videos under 10 min:

1. Fetch both `short` and `medium` results per channel
2. Call `videos.list?part=contentDetails` with the result IDs
3. Parse ISO 8601 duration (e.g. `PT6M32S`) and discard videos at or above 600 seconds (10 min)

### API Quota Management

- YouTube Data API v3 free quota: **10,000 units/day**
- `search.list` costs **100 units** per call
- `videos.list` costs **1 unit** per call
- Strategy: Cache API responses in `sessionStorage` for the duration of a session; re-fetch only on next app open
- Config option in `channels.json` to limit `maxResults` per channel (default: 10)

### API Key Security

- API key stored in a Vercel Environment Variable (`VITE_YOUTUBE_API_KEY`)
- **v1 limitation:** As a Vite app, the key is exposed in the client bundle. Acceptable for personal use. For a public app, proxy through a Vercel serverless function.

---

## 10. Screens & Navigation

```
/           → Feed (main screen)
/settings   → Channel config, clear history, tag management
```

No router needed beyond these two routes. Use React Router v6 with hash routing for GitHub Pages compatibility (though Vercel doesn't need it).

---

## 11. Non-Functional Requirements

| Requirement | Target |
|---|---|
| First Contentful Paint (mobile) | < 2s on 4G |
| Time to first video visible | < 3s |
| Lighthouse PWA score | ≥ 90 |
| Lighthouse Performance (mobile) | ≥ 80 |
| Bundle size (gzipped) | < 200KB (excl. YouTube IFrame) |
| Supported browsers | Chrome 90+, Safari 15+, Firefox 90+ |

---

## 12. Project Structure

```
bytereels/
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── sw.js                  # generated by vite-plugin-pwa
├── src/
│   ├── api/
│   │   └── youtube.js         # YouTube Data API client
│   ├── components/
│   │   ├── SwipeFeed.jsx
│   │   ├── VideoCard.jsx
│   │   ├── YouTubeEmbed.jsx
│   │   ├── FilterBar.jsx
│   │   └── SettingsDrawer.jsx
│   ├── store/
│   │   └── feedStore.js       # Zustand store
│   ├── hooks/
│   │   ├── useWatchHistory.js
│   │   └── useVideoProgress.js
│   ├── data/
│   │   └── channels.json      # curated channel list
│   ├── App.jsx
│   └── main.jsx
├── .env.local                 # VITE_YOUTUBE_API_KEY
├── vite.config.js
└── package.json
```

---

## 13. Testing Strategy

**Approach:** Test-driven development. Write tests before implementation, iterate until passing, then move on.

**Framework:** Vitest + React Testing Library + jsdom

### Test coverage by milestone

| Milestone | Test targets |
|---|---|
| M2 — Data Layer | `parseDuration` (ISO 8601 → seconds), `isUnderTenMinutes` boundary cases (`PT9M59S` passes, `PT10M00S` rejected), Zustand store actions |
| M3 — Feed UI | `VideoCard` renders watched indicator when video is in watch history; `FilterBar` renders correct chips from channel tags |
| M4 — Filters | Filter action updates store; "All" chip resets filter; active filter persists to/restores from LocalStorage |
| M5 — History | `useWatchHistory`: mark started at >10s, mark watched at >90%; `useVideoProgress`: saves and restores timestamp |

### Out of scope for unit tests
- Raw YouTube API fetch calls (mock the client, test the transform)
- YouTube IFrame Player and swipe gesture behavior (manual or Playwright e2e)
- Service worker / PWA install flow

---

## 14. v1 Milestones

| Milestone | Deliverables |
|---|---|
| **M1 — Scaffold** | Vite + React + Tailwind + PWA plugin, manifest, Vercel deploy pipeline |
| **M2 — Data Layer** | `channels.json` schema, YouTube API client, duration filtering, session cache |
| **M3 — Feed UI** | `SwipeFeed`, `VideoCard`, `YouTubeEmbed`, swipe gestures, IntersectionObserver autoplay |
| **M4 — Filters** | `FilterBar`, tag chip logic, filter persistence |
| **M5 — History** | Watch history tracking, progress save/restore, history clear in settings |
| **M6 — Polish** | Offline banner, loading skeletons, empty states, Lighthouse audit, icons |

---

## 14. Future Scope (v2+)

- **YouTube OAuth** — fetch the authenticated user's actual subscriptions automatically
- **Serverless API proxy** — move YouTube API key server-side to allow public deployment
- **Bookmarks** — save videos to a personal watchlist
- **"Not interested"** — hide a video or channel
- **Keyboard shortcuts** — j/k navigation, space to play/pause
- **Chromecast / AirPlay** — send video to TV
- **Curated packs** — shareable `channels.json` bundles for specific learning paths (e.g. "Frontend 2026", "Linux Admin")
- **Shorts support** — opt-in Shorts-only channels using the `UUSH` playlist API (1 quota unit vs 100 for `search.list`); rendered in a separate 9:16 full-screen card layout to avoid aspect ratio conflicts with regular 16:9 videos
