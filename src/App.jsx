import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Feed() {
  return <div className="text-white p-4">Feed — coming in M3</div>
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
