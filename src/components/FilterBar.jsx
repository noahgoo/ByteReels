import { useState, useRef, useEffect } from 'react'
import useFeedStore from '../store/feedStore.js'

const SPEED_OPTIONS = [
  { key: 'any',    label: 'Any length' },
  { key: 'quick',  label: 'Quick <2m' },
  { key: 'short',  label: 'Short 2–5m' },
  { key: 'medium', label: 'Medium 5–10m' },
]

const ChevronIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
  >
    <path
      fillRule="evenodd"
      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
)

export default function FilterBar() {
  const activeFilter = useFeedStore((s) => s.activeFilter)
  const setFilter = useFeedStore((s) => s.setFilter)
  const speedFilter = useFeedStore((s) => s.speedFilter)
  const setSpeedFilter = useFeedStore((s) => s.setSpeedFilter)
  const channels = useFeedStore((s) => s.channels)
  const ALL_TAGS = [...new Set(channels.flatMap((c) => c.tags))].sort()

  const [topicOpen, setTopicOpen] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const containerRef = useRef(null)

  // Close both dropdowns when clicking outside
  useEffect(() => {
    if (!topicOpen && !speedOpen) return
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setTopicOpen(false)
        setSpeedOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [topicOpen, speedOpen])

  const topicLabel = activeFilter === 'all' ? 'All topics' : activeFilter
  const speedLabel = SPEED_OPTIONS.find((o) => o.key === speedFilter)?.label ?? 'Any length'
  const speedActive = speedFilter !== 'any'

  return (
    <div ref={containerRef} className="shrink-0 relative px-4 py-2 flex items-center gap-2">
      {/* Topic filter trigger */}
      <div className="relative">
        <button
          onClick={() => { setTopicOpen((v) => !v); setSpeedOpen(false) }}
          aria-haspopup="listbox"
          aria-expanded={topicOpen}
          className="flex items-center gap-2 h-11 px-4 rounded-full bg-neutral-800 border border-neutral-700 text-sm font-medium text-neutral-200 transition-colors active:bg-neutral-700"
        >
          <span>{topicLabel}</span>
          <ChevronIcon open={topicOpen} />
        </button>

        {topicOpen && (
          <div
            role="listbox"
            aria-label="Filter by topic"
            className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-48 rounded-2xl bg-neutral-900 border border-neutral-700 p-3 shadow-xl"
          >
            <div className="flex flex-wrap gap-2">
              {['all', ...ALL_TAGS].map((tag) => {
                const isActive = activeFilter === tag
                return (
                  <button
                    key={tag}
                    role="option"
                    aria-selected={isActive}
                    aria-pressed={isActive}
                    onClick={() => { setFilter(tag); setTopicOpen(false) }}
                    className={`h-11 px-4 rounded-full text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-white text-[#0d0d0d]'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700 active:bg-neutral-700'
                      }`}
                  >
                    {tag === 'all' ? 'All' : tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Speed filter trigger */}
      <div className="relative">
        <button
          onClick={() => { setSpeedOpen((v) => !v); setTopicOpen(false) }}
          aria-haspopup="listbox"
          aria-expanded={speedOpen}
          className={`flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-medium transition-colors
            ${speedActive
              ? 'bg-white text-[#0d0d0d] border-white'
              : 'bg-neutral-800 border-neutral-700 text-neutral-200 active:bg-neutral-700'
            }`}
        >
          <span>{speedLabel}</span>
          <ChevronIcon open={speedOpen} />
        </button>

        {speedOpen && (
          <div
            role="listbox"
            aria-label="Filter by duration"
            className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-44 rounded-2xl bg-neutral-900 border border-neutral-700 p-3 shadow-xl"
          >
            <div className="flex flex-wrap gap-2">
              {SPEED_OPTIONS.map(({ key, label }) => {
                const isActive = speedFilter === key
                return (
                  <button
                    key={key}
                    role="option"
                    aria-selected={isActive}
                    aria-pressed={isActive}
                    onClick={() => { setSpeedFilter(key); setSpeedOpen(false) }}
                    className={`h-11 px-4 rounded-full text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-white text-[#0d0d0d]'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700 active:bg-neutral-700'
                      }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
