import { renderHook } from '@testing-library/react'
import { useVideoProgress } from './useVideoProgress.js'

beforeEach(() => {
  localStorage.clear()
})

describe('useVideoProgress', () => {
  it('getProgress returns 0 for unknown video', () => {
    const { result } = renderHook(() => useVideoProgress())
    expect(result.current.getProgress('abc')).toBe(0)
  })

  it('saveProgress writes timestamp to localStorage', () => {
    const { result } = renderHook(() => useVideoProgress())
    result.current.saveProgress('abc', 42)
    const stored = JSON.parse(localStorage.getItem('videoProgress'))
    expect(stored['abc']).toBe(42)
  })

  it('getProgress returns saved timestamp', () => {
    const { result } = renderHook(() => useVideoProgress())
    result.current.saveProgress('abc', 137)
    expect(result.current.getProgress('abc')).toBe(137)
  })

  it('initialises from existing localStorage data', () => {
    localStorage.setItem('videoProgress', JSON.stringify({ xyz: 99 }))
    const { result } = renderHook(() => useVideoProgress())
    expect(result.current.getProgress('xyz')).toBe(99)
  })

  it('clearProgress removes localStorage key; getProgress returns 0', () => {
    const { result } = renderHook(() => useVideoProgress())
    result.current.saveProgress('abc', 55)
    result.current.clearProgress()
    expect(result.current.getProgress('abc')).toBe(0)
    expect(localStorage.getItem('videoProgress')).toBeNull()
  })
})
