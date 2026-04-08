import { useRef, useState, useEffect } from 'react'
import YouTubeEmbed from './YouTubeEmbed.jsx'
import { formatDuration, timeAgo } from '../utils/format.js'

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2, 0.75]

function formatPlaybackSpeedLabel(rate) {
  if (Number.isInteger(rate)) return `${rate}×`
  const str = rate.toFixed(2).replace(/\.?0+$/, '')
  return `${str}×`
}

/**
 * Full-viewport video card.
 * @param {{ video: object, isActive: boolean, loadPlayer: boolean, onShare?: function }} props
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
  onShare,
}) {
  const initial = video.channelName.charAt(0).toUpperCase()
  const embedRef = useRef(null)
  const [speedIndex, setSpeedIndex] = useState(0)
  const currentSpeed = PLAYBACK_SPEEDS[speedIndex]

  useEffect(() => {
    if (!isActive) {
      setSpeedIndex(0)
      embedRef.current?.setPlaybackRate?.(1)
    }
  }, [isActive])

  useEffect(() => {
    setSpeedIndex(0)
    embedRef.current?.setPlaybackRate?.(1)
  }, [video.id])

  function handlePlaybackSpeedTap() {
    setSpeedIndex((i) => {
      const next = (i + 1) % PLAYBACK_SPEEDS.length
      const nextRate = PLAYBACK_SPEEDS[next]
      embedRef.current?.setPlaybackRate?.(nextRate)
      return next
    })
  }

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
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-white text-sm font-medium shrink-0"
          >
            {initial}
          </div>
          <span className="text-neutral-300 text-sm font-medium truncate min-w-0 flex-1">
            {video.channelName}
          </span>
          {onShare && (
            <button
              type="button"
              onClick={() =>
                onShare({ title: video.title, url: `https://youtu.be/${video.id}` })
              }
              aria-label="Share video"
              className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-neutral-400 active:opacity-70 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
            </button>
          )}
        </div>

        {/* Title */}
        <h2 className="text-white text-base font-semibold leading-snug line-clamp-2">
          {video.title}
        </h2>

        {/* Duration · time ago */}
        <p className="text-neutral-400 text-xs">
          {formatDuration(video.durationSeconds)} · {timeAgo(video.publishedAt)}
        </p>

        {/* Tags */}
        <ul className="flex flex-wrap gap-1.5" aria-label="tags">
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
      </div>

      {/* Skip + playback speed — fixed to viewport so it stays put during snap-scroll */}
      {isActive && (
        <div
          className="pointer-events-none fixed left-0 right-0 z-30 flex justify-center"
          style={{ bottom: 'max(env(safe-area-inset-bottom), 24px)' }}
        >
          <div
            className="pointer-events-auto flex items-center rounded-full"
            style={{
              background: 'rgba(16, 16, 16, 0.82)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Skip back */}
            <button
              type="button"
              onClick={() => embedRef.current?.seekBy(-15)}
              aria-label="Skip back 15 seconds"
              className="flex items-center gap-2 h-11 pl-5 pr-4 text-white/70 text-sm font-medium active:text-white active:bg-white/[0.07] rounded-l-full transition-colors select-none"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.5 12 20 6v12L11.5 12ZM4 6h2v12H4V6Z" />
              </svg>
              <span>15s</span>
            </button>

            {/* Divider */}
            <div className="w-px bg-white/10 self-stretch my-2.5 shrink-0" />

            {/* Playback speed */}
            <button
              type="button"
              onClick={handlePlaybackSpeedTap}
              aria-label={`Playback speed: ${formatPlaybackSpeedLabel(currentSpeed)}`}
              className={`flex items-center justify-center h-11 w-14 text-xs font-semibold tracking-wide active:bg-white/[0.07] transition-colors select-none ${
                currentSpeed === 1 ? 'text-white/35' : 'text-white/90'
              }`}
            >
              {formatPlaybackSpeedLabel(currentSpeed)}
            </button>

            {/* Divider */}
            <div className="w-px bg-white/10 self-stretch my-2.5 shrink-0" />

            {/* Skip forward */}
            <button
              type="button"
              onClick={() => embedRef.current?.seekBy(15)}
              aria-label="Skip forward 15 seconds"
              className="flex items-center gap-2 h-11 pl-4 pr-5 text-white/70 text-sm font-medium active:text-white active:bg-white/[0.07] rounded-r-full transition-colors select-none"
            >
              <span>15s</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.5 12 4 6v12l8.5-6ZM18 6h2v12h-2V6Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
