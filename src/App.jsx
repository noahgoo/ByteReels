import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import useFeedStore from './store/feedStore.js'
import { fetchAllVideos } from './api/youtube.js'
import channelsData from './data/channels.json'
import mockVideos from './data/mockVideos.js'
import SwipeFeed from './components/SwipeFeed.jsx'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function Feed() {
  const setVideos = useFeedStore((s) => s.setVideos)

  useEffect(() => {
    if (USE_MOCK) {
      setVideos(mockVideos)
      return
    }
    if (!API_KEY) {
      console.warn('VITE_YOUTUBE_API_KEY is not set — cannot fetch videos')
      return
    }
    fetchAllVideos(channelsData.channels, API_KEY)
      .then(setVideos)
      .catch((err) => console.error('Failed to fetch videos:', err))
  }, [setVideos])

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0d0d0d]">
      <header className="shrink-0 px-4 py-2 flex items-center bg-[#0d0d0d]/80 backdrop-blur-sm z-10">
        <span className="text-white font-bold tracking-tight text-lg">ByteReels</span>
      </header>

      {/* FilterBar slot — wired up in M4 */}

      <main className="flex-1 overflow-hidden">
        <SwipeFeed />
      </main>
    </div>
  )
}

function Settings() {
  return <div className="text-white p-4">Settings — coming in M5</div>
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
