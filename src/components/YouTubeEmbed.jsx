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
export default function YouTubeEmbed({ videoId, isActive, preloadDelay = 0 }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const isActiveRef = useRef(isActive)

  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  // Create (or recreate) the player when videoId changes
  useEffect(() => {
    let destroyed = false
    let timer = null

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
            if (isActiveRef.current) player.playVideo()
          },
        },
      })

      playerRef.current = player
    })

    timer = setTimeout(create, preloadDelay)

    return () => {
      destroyed = true
      clearTimeout(timer)
      try { playerRef.current?.destroy() } catch { /* already gone */ }
      playerRef.current = null
    }
  }, [videoId, preloadDelay])

  // Play/pause when isActive changes
  useEffect(() => {
    const player = playerRef.current
    if (!player || typeof player.getPlayerState !== 'function') return
    if (isActive) {
      const state = player.getPlayerState()
      if (state !== 1 /* not already PLAYING */) player.playVideo()
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
