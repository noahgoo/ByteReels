import { useState, useRef, useEffect } from 'react'
import channelsData from '../data/channels.json'
import useFeedStore from '../store/feedStore.js'

// Derive sorted unique tags from all channels once at module load
const ALL_TAGS = [...new Set(channelsData.channels.flatMap((c) => c.tags))].sort()

export default function FilterBar() {
  const activeFilter = useFeedStore((s) => s.activeFilter)
  const setFilter = useFeedStore((s) => s.setFilter)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const label = activeFilter === 'all' ? 'All topics' : activeFilter

  return (
    <div ref={containerRef} className="shrink-0 relative px-4 py-2">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 h-11 px-4 rounded-full bg-neutral-800 border border-neutral-700 text-sm font-medium text-neutral-200 transition-colors active:bg-neutral-700"
      >
        <span>{label}</span>
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
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Filter by topic"
          className="absolute left-4 right-4 top-[calc(100%-4px)] z-20 rounded-2xl bg-neutral-900 border border-neutral-700 p-3 shadow-xl"
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
                  onClick={() => {
                    setFilter(tag)
                    setOpen(false)
                  }}
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
  )
}
