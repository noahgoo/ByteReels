import { useRef } from 'react'
import YouTubeEmbed from './YouTubeEmbed.jsx'
import { formatDuration, timeAgo } from '../utils/format.js'

/**
 * Full-viewport video card.
 * @param {{ video: object, isActive: boolean, loadPlayer: boolean }} props
 * loadPlayer: mount the YouTube IFrame player (true for cursor ±1, false otherwise
 * to avoid hitting the browser's WebGL context limit)
 */
export default function VideoCard({
  video,
  isActive,
  loadPlayer = true,
  preloadDelay = 0,
  isWatched = false,
  savedProgress = 0,
  onTimeUpdate,
  gestureEstablished = false,
  onFirstGesture,
  onNotInterested,
}) {
  const initial = video.channelName.charAt(0).toUpperCase()
  const embedRef = useRef(null)

  return (
    <article className="relative h-full w-full flex flex-col justify-center bg-[#0d0d0d] snap-start overflow-hidden">
      <div className="relative w-full shrink-0">
        {loadPlayer ? (
          <YouTubeEmbed
            ref={embedRef}
            videoId={video.id}
            isActive={isActive}
            preloadDelay={preloadDelay}
            initialTime={savedProgress}
            onTimeUpdate={onTimeUpdate}
            gestureEstablished={gestureEstablished}
            onFirstGesture={onFirstGesture}
          />
        ) : (
          <div className="w-full aspect-video bg-black overflow-hidden">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {isWatched && (
          <div
            data-testid="watched-indicator"
            aria-label="Watched"
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center pointer-events-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 text-black"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        {/* Channel row */}
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-white text-sm font-medium shrink-0"
          >
            {initial}
          </div>
          <span className="text-neutral-300 text-sm font-medium truncate">
            {video.channelName}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-white text-base font-semibold leading-snug line-clamp-2">
          {video.title}
        </h2>

        {/* Duration · time ago */}
        <p className="text-neutral-400 text-xs">
          {formatDuration(video.durationSeconds)} · {timeAgo(video.publishedAt)}
        </p>

        {/* Tags + Not Interested inline */}
        <div className="flex items-start justify-between gap-3">
          <ul className="flex flex-wrap gap-1.5 flex-1 min-w-0" aria-label="tags">
            {video.channelTags.map((tag) => (
              <li
                key={tag}
                data-testid="tag-chip"
                className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-xs"
              >
                {tag}
              </li>
            ))}
          </ul>
          {onNotInterested && (
            <button
              onClick={onNotInterested}
              className="shrink-0 border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 active:text-neutral-200 text-xs px-3 py-1 rounded-full transition-colors min-h-[44px] flex items-center"
            >
              Not interested
            </button>
          )}
        </div>
      </div>

      {/* Skip controls — only on active card */}
      {isActive && (
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-8 z-20 pointer-events-none">
          <button
            onClick={() => embedRef.current?.seekBy(-15)}
            aria-label="Skip back 15 seconds"
            className="pointer-events-auto flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500 active:bg-orange-400 flex items-center justify-center transition-colors shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                <text x="12" y="13.5" textAnchor="middle" fontSize="6" fill="white" stroke="none" fontWeight="bold">15</text>
              </svg>
            </div>
            <span className="text-orange-400 text-[10px] font-medium">−15s</span>
          </button>
          <button
            onClick={() => embedRef.current?.seekBy(15)}
            aria-label="Skip forward 15 seconds"
            className="pointer-events-auto flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500 active:bg-orange-400 flex items-center justify-center transition-colors shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-.49-3.5" />
                <text x="12" y="13.5" textAnchor="middle" fontSize="6" fill="white" stroke="none" fontWeight="bold">15</text>
              </svg>
            </div>
            <span className="text-orange-400 text-[10px] font-medium">+15s</span>
          </button>
        </div>
      )}
    </article>
  )
}
