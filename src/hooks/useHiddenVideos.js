import { useState, useCallback } from 'react'

const KEY = 'bytereels_hidden'

export function useHiddenVideos() {
  const [hidden, setHidden] = useState(
    () => JSON.parse(localStorage.getItem(KEY) ?? '{}')
  )

  const markHidden = useCallback((id) => {
    setHidden((prev) => {
      const next = { ...prev, [id]: true }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isHidden = useCallback((id) => !!hidden[id], [hidden])

  const clearHidden = useCallback(() => {
    localStorage.removeItem(KEY)
    setHidden({})
  }, [])

  return { isHidden, markHidden, clearHidden }
}
