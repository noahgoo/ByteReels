import { useRef, useEffect, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSwipeable } from 'react-swipeable'
import useFeedStore from '../store/feedStore.js'
import VideoCard from './VideoCard.jsx'
import VideoCardSkeleton from './VideoCardSkeleton.jsx'
import { useWatchHistory } from '../hooks/useWatchHistory.js'
import { useVideoProgress } from '../hooks/useVideoProgress.js'
import { useHiddenVideos } from '../hooks/useHiddenVideos.js'

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="text-4xl select-none">{icon}</div>
      <p className="text-white text-base font-semibold">{title}</p>
      {subtitle && <p className="text-neutral-500 text-sm">{subtitle}</p>}
      {action}
    </div>
  )
}

export default function SwipeFeed({ isLoading = false, onNotInterestedRef }) {
  const videos = useFeedStore((s) => s.videos)
  const activeFilter = useFeedStore((s) => s.activeFilter)
  const speedFilter = useFeedStore((s) => s.speedFilter)
  const cursor = useFeedStore((s) => s.cursor)
  const channels = useFeedStore((s) => s.channels)
  const setFilter = useFeedStore((s) => s.setFilter)

  const incrementCursor = useFeedStore((s) => s.incrementCursor)
  const decrementCursor = useFeedStore((s) => s.decrementCursor)

  const { isWatched, markStarted, markWatched } = useWatchHistory()
  const { getProgress, saveProgress } = useVideoProgress()
  const { isHidden, markHidden } = useHiddenVideos()

  // Step 1: tag filter + exclude hidden videos (reactive — updates immediately on hide)
  const filtered = (activeFilter === 'all' ? videos : videos.filter((v) => v.channelTags?.includes(activeFilter)))
    .filter((v) => !isHidden(v.id))

  // Step 2: speed (duration) filter — AND-combined with tag filter
  const SPEED_RANGES = { quick: [0, 120], short: [120, 300], medium: [300, 600] }
  const speedFiltered = speedFilter === 'any'
    ? filtered
    : filtered.filter((v) => {
        const [min, max] = SPEED_RANGES[speedFilter]
        return v.durationSeconds >= min && v.durationSeconds < max
      })

  // Step 3: stable sort — only recomputes when the video set changes,
  // NOT when isWatched changes mid-playback (prevents the feed jumping when
  // a video hits 90% completion while the user is still watching it).
  // The sort picks up the latest watch state the next time the cursor moves.
  // Include speedFilter in key so sort recomputes when the bucket changes.
  const filteredKey = speedFiltered.map((v) => v.id).join(',') + '|' + speedFilter
  const sortKeyRef = useRef(null)
  const displayedRef = useRef([])
  // Sort key is based only on the video list — NOT cursor. This means the sort
  // recomputes when videos are added/hidden/filtered, but NOT when the user
  // swipes. Excluding cursor prevents two bugs:
  //   1. Mid-playback jump: sort would fire at 90% and move the active card.
  //   2. Double-skip: sort fires on swipe, indices shift, cursor lands two ahead.
  // Previously-watched videos are sorted to the bottom on load (from localStorage).
  // Videos watched in the current session sink to the bottom on the next refresh.
  const sortKey = filteredKey
  if (sortKeyRef.current !== sortKey) {
    sortKeyRef.current = sortKey
    displayedRef.current = [...speedFiltered].sort((a, b) => {
      const aW = isWatched(a.id)
      const bW = isWatched(b.id)
      if (aW === bW) return 0
      return aW ? 1 : -1
    })
  }
  const displayedVideos = displayedRef.current

  const [gestureEstablished, setGestureEstablished] = useState(false)

  const containerRef = useRef(null)
  const scrollingRef = useRef(false)

  // ─── Swipe handlers ─────────────────────────────────────────────────────────
  const handlers = useSwipeable({
    onSwipedUp: incrementCursor,
    onSwipedDown: decrementCursor,
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
    delta: 50,
  })

  // Merge swipeable ref with our containerRef
  const mergedRef = useCallback(
    (el) => {
      containerRef.current = el
      handlers.ref(el)
    },
    // handlers.ref is stable; handlers object identity changes each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ─── Scroll sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current?.children[cursor]
    if (typeof el?.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [cursor])

  // ─── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        incrementCursor()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        decrementCursor()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [incrementCursor, decrementCursor])

  // ─── Scroll wheel navigation ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (e) => {
      if (scrollingRef.current) return
      scrollingRef.current = true
      if (e.deltaY > 0) {
        incrementCursor()
      } else {
        decrementCursor()
      }
      setTimeout(() => {
        scrollingRef.current = false
      }, 800)
    }

    container.addEventListener('wheel', onWheel, { passive: true })
    return () => container.removeEventListener('wheel', onWheel)
  }, [incrementCursor, decrementCursor])

  // ─── IntersectionObserver — keep cursor in sync on manual scroll ─────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container || displayedVideos.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(container.children).indexOf(entry.target)
            if (index !== -1) {
              useFeedStore.setState({ cursor: index })
            }
          }
        })
      },
      { threshold: 0.9 }
    )

    Array.from(container.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [displayedVideos])

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (isLoading && videos.length === 0) {
    return (
      <div className="h-full overflow-hidden">
        <VideoCardSkeleton />
      </div>
    )
  }

  // ─── Empty states ────────────────────────────────────────────────────────────
  if (!isLoading && channels.length === 0) {
    return (
      <EmptyState
        icon="📺"
        title="No channels yet"
        subtitle="Add a channel in Settings to start your feed."
        action={
          <Link
            to="/settings"
            className="mt-1 min-h-11 px-5 flex items-center rounded-xl bg-white text-[#0d0d0d] text-sm font-semibold active:opacity-70 transition-opacity"
          >
            Go to Settings
          </Link>
        }
      />
    )
  }

  if (displayedVideos.length === 0 && activeFilter !== 'all') {
    return (
      <EmptyState
        icon="🔍"
        title={`No videos tagged "${activeFilter}"`}
        subtitle="Try a different filter or add more channels."
        action={
          <button
            onClick={() => setFilter('all')}
            className="mt-1 min-h-11 px-5 rounded-xl bg-neutral-800 text-white text-sm font-medium active:opacity-70 transition-opacity"
          >
            Show all
          </button>
        }
      />
    )
  }

  if (displayedVideos.length === 0) {
    return (
      <EmptyState
        icon="🎬"
        title="No videos loaded"
        subtitle="Pull to refresh or check your channel list."
      />
    )
  }

  function handleNotInterested(videoId) {
    // If hiding the last card, step cursor back so we don't land on a blank slot
    const newLen = displayedVideos.length - 1
    if (cursor >= newLen && newLen > 0) {
      useFeedStore.setState({ cursor: newLen - 1 })
    }
    markHidden(videoId)
  }

  // Keep the ref current so the app-shell button can trigger hide for the active video
  if (onNotInterestedRef) {
    const activeId = displayedVideos[cursor]?.id
    onNotInterestedRef.current = activeId ? () => handleNotInterested(activeId) : null
  }

  return (
    <div
      ref={mergedRef}
      className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {displayedVideos.map((video, i) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={i === cursor}
          loadPlayer={i >= cursor - 1 && i <= cursor + 2}
          preloadDelay={i === cursor || i === cursor + 1 ? 0 : 1000}
          isWatched={isWatched(video.id)}
          savedProgress={getProgress(video.id)}
          gestureEstablished={gestureEstablished}
          onFirstGesture={() => setGestureEstablished(true)}
          onTimeUpdate={(currentTime, duration) => {
            if (currentTime > 10) markStarted(video.id)
            if (duration > 0 && currentTime / duration > 0.9) markWatched(video.id)
            if (currentTime > 0) saveProgress(video.id, currentTime)
          }}
        />
      ))}
    </div>
  )
}
