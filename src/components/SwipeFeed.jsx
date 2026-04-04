import { useRef, useEffect, useCallback } from 'react'
import { useSwipeable } from 'react-swipeable'
import useFeedStore from '../store/feedStore.js'
import VideoCard from './VideoCard.jsx'

export default function SwipeFeed() {
  const videos = useFeedStore((s) => s.videos)
  const cursor = useFeedStore((s) => s.cursor)
  const incrementCursor = useFeedStore((s) => s.incrementCursor)
  const decrementCursor = useFeedStore((s) => s.decrementCursor)

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
    if (!container || videos.length === 0) return

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
  }, [videos])

  // ─── Loading / empty state ───────────────────────────────────────────────────
  if (videos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
        Loading videos…
      </div>
    )
  }

  return (
    <div
      ref={mergedRef}
      className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {videos.map((video, i) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={i === cursor}
          loadPlayer={Math.abs(i - cursor) <= 1}
        />
      ))}
    </div>
  )
}
