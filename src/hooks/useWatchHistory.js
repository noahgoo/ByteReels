import { useState, useCallback } from 'react'

const KEY = 'watchHistory'

export function useWatchHistory() {
  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem(KEY) ?? '{}')
  )

  const markStarted = useCallback((id) => {
    setHistory((prev) => {
      if (prev[id]?.started) return prev
      const next = { ...prev, [id]: { ...prev[id], started: true } }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const markWatched = useCallback((id) => {
    setHistory((prev) => {
      if (prev[id]?.watched) return prev
      const next = { ...prev, [id]: { ...prev[id], watched: true, started: true } }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isStarted = useCallback((id) => !!history[id]?.started, [history])
  const isWatched = useCallback((id) => !!history[id]?.watched, [history])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY)
    setHistory({})
  }, [])

  return { isStarted, isWatched, markStarted, markWatched, clearHistory }
}
