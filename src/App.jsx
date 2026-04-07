import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import useFeedStore from "./store/feedStore.js";
import { loadPersistedFilter } from "./store/feedStore.js";
import {
  fetchAllVideos,
  clearVideoCache,
  resolveChannel,
} from "./api/youtube.js";
import mockVideos from "./data/mockVideos.js";
import SwipeFeed from "./components/SwipeFeed.jsx";
import FilterBar from "./components/FilterBar.jsx";
import InstallBanner from "./components/InstallBanner.jsx";
import { useWatchHistory } from "./hooks/useWatchHistory.js";
import { useVideoProgress } from "./hooks/useVideoProgress.js";
import useOnlineStatus from "./hooks/useOnlineStatus.js";
import { Analytics } from "@vercel/analytics/react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function Feed() {
  const setVideos = useFeedStore((s) => s.setVideos);
  const setFilter = useFeedStore((s) => s.setFilter);
  const channels = useFeedStore((s) => s.channels);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isOnline = useOnlineStatus();

  // Restore active filter from localStorage on mount
  useEffect(() => {
    setFilter(loadPersistedFilter());
  }, [setFilter]);

  useEffect(() => {
    if (USE_MOCK) {
      setVideos(mockVideos);
      setIsInitialLoad(false);
      return;
    }
    if (!API_KEY) {
      console.warn("VITE_YOUTUBE_API_KEY is not set — cannot fetch videos");
      return;
    }
    setIsRefreshing(true);
    fetchAllVideos(channels, API_KEY)
      .then((vids) => {
        setVideos(vids);
        setIsInitialLoad(false);
      })
      .catch((err) => console.error("Failed to fetch videos:", err))
      .finally(() => setIsRefreshing(false));
    // channels is stable by reference when unchanged; refreshKey forces a re-fetch
  }, [setVideos, refreshKey, channels]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRefresh() {
    clearVideoCache();
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-dvh bg-[#0d0d0d]">
      <header className="shrink-0 px-4 py-2 flex items-center bg-[#0d0d0d]/80 backdrop-blur-sm z-10">
        <span className="text-white font-bold tracking-tight text-lg">
          ByteReels
        </span>
        <Link
          to="/settings"
          aria-label="Settings"
          className="ml-auto flex items-center justify-center min-h-11 min-w-11 text-white/60 hover:text-white active:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !isOnline}
          aria-label={isOnline ? "Refresh feed" : "Cannot refresh while offline"}
          className="flex items-center justify-center min-h-11 min-w-11 text-white/60 hover:text-white active:text-white disabled:opacity-40 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </header>

      {!isOnline && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-900/60 border-b border-amber-700/50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-400 shrink-0">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-amber-300 text-xs">You&apos;re offline — showing cached videos</p>
        </div>
      )}

      <FilterBar />

      <main className="flex-1 overflow-hidden">
        <SwipeFeed isLoading={isInitialLoad} />
      </main>
    </div>
  );
}

function AddChannelForm() {
  const addChannel = useFeedStore((s) => s.addChannel);
  const channels = useFeedStore((s) => s.channels);
  const [input, setInput] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState(null); // null | 'loading' | { error } | { name }

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim()) return;

      if (!API_KEY) {
        setStatus({
          error: "API key required to add channels. Set VITE_YOUTUBE_API_KEY.",
        });
        return;
      }

      setStatus("loading");
      try {
        const { id, name } = await resolveChannel(input.trim(), API_KEY);
        if (channels.some((c) => c.id === id)) {
          setStatus({ error: `${name} is already in your feed.` });
          return;
        }
        const parsedTags = tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        addChannel({ id, name, tags: parsedTags, maxResults: 10 });
        clearVideoCache();
        setInput("");
        setTags("");
        setStatus({ name });
        setTimeout(() => setStatus(null), 3000);
      } catch (err) {
        setStatus({
          error: err.message.includes("not found")
            ? "Channel not found. Check the URL or handle."
            : "Failed to resolve channel. Try again.",
        });
      }
    },
    [input, tags, channels, addChannel],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="youtube.com/@handle or channel ID"
        className="w-full min-h-11 px-4 rounded-xl bg-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
      />
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags: react, css, ai  (comma separated)"
        className="w-full min-h-11 px-4 rounded-xl bg-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
      />
      <button
        type="submit"
        disabled={status === "loading" || !input.trim()}
        className="min-h-11 px-4 rounded-xl bg-white text-[#0d0d0d] text-sm font-semibold disabled:opacity-40 transition-opacity active:opacity-70"
      >
        {status === "loading" ? "Looking up…" : "Add channel"}
      </button>
      {status && status !== "loading" && (
        <p
          className={`text-xs ${status.error ? "text-red-400" : "text-green-400"}`}
        >
          {status.error ?? `Added ${status.name}!`}
        </p>
      )}
    </form>
  );
}

function Settings() {
  const channels = useFeedStore((s) => s.channels);
  const removeChannel = useFeedStore((s) => s.removeChannel);
  const { clearHistory } = useWatchHistory();
  const { clearProgress } = useVideoProgress();
  const [cleared, setCleared] = useState(false);

  function handleClear() {
    clearHistory();
    clearProgress();
    setCleared(true);
  }

  return (
    <div className="min-h-dvh bg-[#0d0d0d] text-white flex flex-col">
      <header className="shrink-0 px-4 py-2 flex items-center gap-3 bg-[#0d0d0d]/80 backdrop-blur-sm">
        <Link
          to="/"
          aria-label="Back to feed"
          className="flex items-center justify-center min-h-11 min-w-11 text-white/60 hover:text-white active:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-white font-bold tracking-tight text-lg">
          Settings
        </span>
      </header>

      <div className="px-4 py-6 flex flex-col gap-8">
        {/* ── Channels ───────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Channels
          </h2>

          <ul className="flex flex-col gap-1">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex items-center gap-3 min-h-11 px-4 rounded-xl bg-neutral-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {ch.name}
                  </p>
                  {ch.tags.length > 0 && (
                    <p className="text-neutral-500 text-xs truncate">
                      {ch.tags.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeChannel(ch.id)}
                  aria-label={`Remove ${ch.name}`}
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:text-red-400 active:text-red-400 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
            {channels.length === 0 && (
              <li className="text-neutral-500 text-sm px-1">
                No channels — add one below.
              </li>
            )}
          </ul>

          <AddChannelForm />
        </section>

        {/* ── Watch History ──────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Watch History
          </h2>
          <button
            onClick={handleClear}
            className="w-full min-h-11 px-4 rounded-xl bg-neutral-800 text-white text-sm font-medium text-left hover:bg-neutral-700 active:bg-neutral-700 transition-colors"
          >
            Clear history &amp; progress
          </button>
          {cleared && (
            <p className="text-neutral-500 text-xs">History cleared.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <div className="min-h-screen bg-[#0d0d0d]">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <InstallBanner />
    </BrowserRouter>
  );
}
