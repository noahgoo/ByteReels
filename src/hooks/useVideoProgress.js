import { useCallback } from 'react'

const KEY = 'videoProgress'

export function useVideoProgress() {
  const getProgress = useCallback((id) => {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return data[id] ?? 0
  }, [])

  const saveProgress = useCallback((id, time) => {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    data[id] = time
    localStorage.setItem(KEY, JSON.stringify(data))
  }, [])

  const clearProgress = useCallback(() => {
    localStorage.removeItem(KEY)
  }, [])

  return { getProgress, saveProgress, clearProgress }
}
