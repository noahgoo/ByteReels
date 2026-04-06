import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import useFeedStore from './store/feedStore.js'
import { loadPersistedFilter } from './store/feedStore.js'
import { fetchAllVideos, clearVideoCache } from './api/youtube.js'
import channelsData from './data/channels.json'
import mockVideos from './data/mockVideos.js'
import SwipeFeed from './components/SwipeFeed.jsx'
import FilterBar from './components/FilterBar.jsx'
import { useWatchHistory } from './hooks/useWatchHistory.js'
import { useVideoProgress } from './hooks/useVideoProgress.js'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function Feed() {
  const setVideos = useFeedStore((s) => s.setVideos)
  const setFilter = useFeedStore((s) => s.setFilter)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Restore active filter from localStorage on mount
  useEffect(() => {
    setFilter(loadPersistedFilter())
  }, [setFilter])

  useEffect(() => {
    if (USE_MOCK) {
      setVideos(mockVideos)
      return
    }
    if (!API_KEY) {
      console.warn('VITE_YOUTUBE_API_KEY is not set — cannot fetch videos')
      return
    }
    setIsRefreshing(true)
    fetchAllVideos(channelsData.channels, API_KEY)
      .then(setVideos)
      .catch((err) => console.error('Failed to fetch videos:', err))
      .finally(() => setIsRefreshing(false))
  }, [setVideos, refreshKey])

  function handleRefresh() {
    clearVideoCache()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-dvh bg-[#0d0d0d]">
      <header className="shrink-0 px-4 py-2 flex items-center bg-[#0d0d0d]/80 backdrop-blur-sm z-10">
        <span className="text-white font-bold tracking-tight text-lg">ByteReels</span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh feed"
          className="ml-auto flex items-center justify-center min-h-11 min-w-11 text-white/60 hover:text-white active:text-white disabled:opacity-40 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </header>

      <FilterBar />

      <main className="flex-1 overflow-hidden">
        <SwipeFeed />
      </main>
    </div>
  )
}

function Settings() {
  const { clearHistory } = useWatchHistory()
  const { clearProgress } = useVideoProgress()
  const [cleared, setCleared] = useState(false)

  function handleClear() {
    clearHistory()
    clearProgress()
    setCleared(true)
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
        <span className="text-white font-bold tracking-tight text-lg">Settings</span>
      </header>

      <div className="px-4 py-6 flex flex-col gap-6">
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
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0d0d0d]">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
