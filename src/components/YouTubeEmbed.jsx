import { useRef, useEffect } from 'react'

// ─── YouTube IFrame API singleton ─────────────────────────────────────────────

let apiReady = false
let apiReadyCallbacks = []

window.onYouTubeIframeAPIReady = () => {
  apiReady = true
  apiReadyCallbacks.forEach((cb) => cb())
  apiReadyCallbacks = []
}

function loadYouTubeAPI() {
  if (apiReady) return Promise.resolve()
  return new Promise((resolve) => {
    apiReadyCallbacks.push(resolve)
    if (!document.querySelector('script[src*="iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(script)
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Controlled YouTube IFrame embed.
 *
 * Audio strategy: mute:0 so YouTube loads audio+video streams from the start.
 * On iOS Safari the first playVideo() call may be blocked until a user gesture;
 * YouTube's own UI handles that with its play button. After any gesture,
 * subsequent cards play with audio automatically.
 */
export default function YouTubeEmbed({
  videoId,
  isActive,
  preloadDelay = 0,
  initialTime = 0,
  onTimeUpdate,
}) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const isActiveRef = useRef(isActive)
  const intervalRef = useRef(null)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const pendingSeekRef = useRef(0)

  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])

  // Create (or recreate) the player when videoId changes
  useEffect(() => {
    let destroyed = false
    let timer = null

    pendingSeekRef.current = initialTime > 0 ? initialTime : 0

    const create = () => loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return

      const player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          mute: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (destroyed) return
            if (isActiveRef.current) {
              if (pendingSeekRef.current > 0) {
                player.seekTo(pendingSeekRef.current, true)
                pendingSeekRef.current = 0
              }
              player.playVideo()
            }
          },
        },
      })

      playerRef.current = player
    })

    timer = setTimeout(create, preloadDelay)

    return () => {
      destroyed = true
      clearTimeout(timer)
      clearInterval(intervalRef.current)
      intervalRef.current = null
      try { playerRef.current?.destroy() } catch { /* already gone */ }
      playerRef.current = null
    }
    // initialTime is intentionally omitted — capture-on-mount semantics only.
    // seekTo on a non-active player triggers YouTube auto-play; pendingSeekRef
    // defers the seek until the card actually becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, preloadDelay])

  // Play/pause when isActive changes
  useEffect(() => {
    const player = playerRef.current
    if (!player || typeof player.getPlayerState !== 'function') return
    if (isActive) {
      if (pendingSeekRef.current > 0) {
        player.seekTo(pendingSeekRef.current, true)
        pendingSeekRef.current = 0
      }
      const state = player.getPlayerState()
      if (state !== 1 /* not already PLAYING */) player.playVideo()
    } else {
      player.pauseVideo()
    }
  }, [isActive])

  // Poll for time updates while active
  useEffect(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    if (!isActive || !onTimeUpdateRef.current) return
    intervalRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player || typeof player.getCurrentTime !== 'function') return
      const currentTime = player.getCurrentTime()
      const duration = player.getDuration()
      if (duration > 0) onTimeUpdateRef.current(currentTime, duration)
    }, 1000)
    return () => {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isActive])

  return (
    <div className="w-full aspect-video bg-black shrink-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
