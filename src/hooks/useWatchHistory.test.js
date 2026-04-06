import { renderHook, act } from '@testing-library/react'
import { useWatchHistory } from './useWatchHistory.js'

beforeEach(() => {
  localStorage.clear()
})

describe('useWatchHistory', () => {
  it('isWatched returns false for unknown video', () => {
    const { result } = renderHook(() => useWatchHistory())
    expect(result.current.isWatched('abc')).toBe(false)
  })

  it('isStarted returns false for unknown video', () => {
    const { result } = renderHook(() => useWatchHistory())
    expect(result.current.isStarted('abc')).toBe(false)
  })

  it('markStarted sets isStarted to true', () => {
    const { result } = renderHook(() => useWatchHistory())
    act(() => result.current.markStarted('abc'))
    expect(result.current.isStarted('abc')).toBe(true)
  })

  it('markWatched sets isWatched to true', () => {
    const { result } = renderHook(() => useWatchHistory())
    act(() => result.current.markWatched('abc'))
    expect(result.current.isWatched('abc')).toBe(true)
  })

  it('markWatched persists to localStorage', () => {
    const { result } = renderHook(() => useWatchHistory())
    act(() => result.current.markWatched('abc'))
    const stored = JSON.parse(localStorage.getItem('watchHistory'))
    expect(stored['abc'].watched).toBe(true)
  })

  it('initialises from existing localStorage data', () => {
    localStorage.setItem(
      'watchHistory',
      JSON.stringify({ xyz: { started: true, watched: true } })
    )
    const { result } = renderHook(() => useWatchHistory())
    expect(result.current.isWatched('xyz')).toBe(true)
    expect(result.current.isStarted('xyz')).toBe(true)
  })

  it('clearHistory resets state and removes localStorage key', () => {
    const { result } = renderHook(() => useWatchHistory())
    act(() => result.current.markWatched('abc'))
    act(() => result.current.clearHistory())
    expect(result.current.isWatched('abc')).toBe(false)
    expect(localStorage.getItem('watchHistory')).toBeNull()
  })
})
