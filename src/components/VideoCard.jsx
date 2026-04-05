import YouTubeEmbed from './YouTubeEmbed.jsx'
import { formatDuration, timeAgo } from '../utils/format.js'

/**
 * Full-viewport video card.
 * @param {{ video: object, isActive: boolean, loadPlayer: boolean }} props
 * loadPlayer: mount the YouTube IFrame player (true for cursor ±1, false otherwise
 * to avoid hitting the browser's WebGL context limit)
 */
export default function VideoCard({ video, isActive, loadPlayer = true }) {
  const initial = video.channelName.charAt(0).toUpperCase()

  return (
    <article className="h-full w-full flex flex-col justify-center bg-[#0d0d0d] snap-start overflow-hidden">
      {loadPlayer ? (
        <YouTubeEmbed videoId={video.id} isActive={isActive} />
      ) : (
        <div className="w-full aspect-video bg-black shrink-0 overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

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

        {/* Tag chips */}
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
    </article>
  )
}
