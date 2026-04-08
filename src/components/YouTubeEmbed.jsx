import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

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
 *
 * Tap-to-play overlay: shown on the active card until the user has established
 * a gesture (gestureEstablished=false). On iOS Safari, playVideo() is blocked
 * until a user gesture — the overlay makes this explicit and handles playback.
 * After the first tap, all subsequent cards auto-play (gestureEstablished=true).
 */
const YouTubeEmbed = forwardRef(function YouTubeEmbed({
  videoId,
  isActive,
  preloadDelay = 0,
  initialTime = 0,
  onTimeUpdate,
  gestureEstablished = false,
  onFirstGesture,
}, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const isActiveRef = useRef(isActive)
  const gestureEstablishedRef = useRef(gestureEstablished)
  const intervalRef = useRef(null)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const pendingSeekRef = useRef(0)

  useImperativeHandle(ref, () => ({
    seekBy(seconds) {
      const player = playerRef.current
      if (!player || typeof player.getCurrentTime !== 'function') return
      const newTime = Math.max(0, player.getCurrentTime() + seconds)
      player.seekTo(newTime, true)
    },
    setPlaybackRate(rate) {
      const player = playerRef.current
      if (!player || typeof player.setPlaybackRate !== 'function') return
      player.setPlaybackRate(rate)
    },
  }), [])

  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    gestureEstablishedRef.current = gestureEstablished
  }, [gestureEstablished])

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
            if (isActiveRef.current && gestureEstablishedRef.current) {
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
      if (gestureEstablishedRef.current) {
        const state = player.getPlayerState()
        if (state !== 1 /* not already PLAYING */) player.playVideo()
      }
      // if gesture not established: overlay is shown, tap will call playVideo
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

  function handleOverlayTap() {
    onFirstGesture?.()
    const player = playerRef.current
    if (!player || typeof player.playVideo !== 'function') return
    if (pendingSeekRef.current > 0) {
      player.seekTo(pendingSeekRef.current, true)
      pendingSeekRef.current = 0
    }
    player.playVideo()
  }

  return (
    <div className="w-full aspect-video bg-black shrink-0 relative">
      <div ref={containerRef} className="w-full h-full" />
      {isActive && !gestureEstablished && (
        <button
          onClick={handleOverlayTap}
          aria-label="Tap to play"
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 cursor-pointer w-full h-full"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="w-7 h-7 translate-x-0.5"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p className="text-white/80 text-sm mt-3 font-medium">Tap to play</p>
        </button>
      )}
    </div>
  )
})

export default YouTubeEmbed
