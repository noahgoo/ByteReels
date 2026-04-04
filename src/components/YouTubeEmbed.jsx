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

// ─── One-time gesture gate ────────────────────────────────────────────────────
// Browsers block unmuted autoplay until the user has tapped/clicked once.
// After that first gesture we unmute the active player and all future cards
// play with sound automatically.

let userHasGestured = false
const pendingUnmuteCallbacks = new Set()

function recordGesture() {
  userHasGestured = true
  pendingUnmuteCallbacks.forEach((cb) => cb())
  pendingUnmuteCallbacks.clear()
}
document.addEventListener('pointerdown', recordGesture, { once: true })

/**
 * Unmute the player immediately if the user has already gestured,
 * otherwise queue it for when they do.
 * Returns a cleanup function that cancels the pending callback.
 */
function unmuteWhenReady(player) {
  if (userHasGestured) {
    player.unMute()
    player.setVolume(100)
    return () => {}
  }
  const cb = () => {
    player.unMute?.()
    player.setVolume?.(100)
  }
  pendingUnmuteCallbacks.add(cb)
  return () => { pendingUnmuteCallbacks.delete(cb) }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Controlled YouTube IFrame embed.
 * Plays when isActive=true, pauses when isActive=false.
 * Starts muted; unmutes automatically after the user's first tap anywhere.
 */
export default function YouTubeEmbed({ videoId, isActive }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const isActiveRef = useRef(isActive)

  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  // Create (or recreate) the player when videoId changes
  useEffect(() => {
    let destroyed = false
    let cleanupUnmute = () => {}

    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return

      const player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          mute: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (destroyed) return
            if (isActiveRef.current) player.playVideo()
          },
          onStateChange: (e) => {
            // Only unmute once the video is actually playing — not while buffering.
            // This prevents audio playing over a loading spinner on fast swipes.
            if (!destroyed && e.data === window.YT.PlayerState.PLAYING) {
              cleanupUnmute()
              cleanupUnmute = unmuteWhenReady(player)
            }
          },
        },
      })

      playerRef.current = player
    })

    return () => {
      destroyed = true
      cleanupUnmute()
      try { playerRef.current?.destroy() } catch { /* already gone */ }
      playerRef.current = null
    }
  }, [videoId])

  // Play/pause when isActive changes — unmuting is handled by onStateChange
  useEffect(() => {
    const player = playerRef.current
    if (!player || typeof player.getPlayerState !== 'function') return
    if (isActive) {
      player.playVideo()
    } else {
      player.pauseVideo()
    }
  }, [isActive])

  return (
    <div className="w-full aspect-video bg-black shrink-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
