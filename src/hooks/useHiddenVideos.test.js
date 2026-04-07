import { renderHook, act } from '@testing-library/react'
import { useHiddenVideos } from './useHiddenVideos.js'

beforeEach(() => {
  localStorage.clear()
})

describe('useHiddenVideos', () => {
  it('isHidden returns false for unknown video', () => {
    const { result } = renderHook(() => useHiddenVideos())
    expect(result.current.isHidden('abc')).toBe(false)
  })

  it('markHidden sets isHidden to true', () => {
    const { result } = renderHook(() => useHiddenVideos())
    act(() => result.current.markHidden('abc'))
    expect(result.current.isHidden('abc')).toBe(true)
  })

  it('markHidden persists to localStorage', () => {
    const { result } = renderHook(() => useHiddenVideos())
    act(() => result.current.markHidden('abc'))
    const stored = JSON.parse(localStorage.getItem('bytereels_hidden'))
    expect(stored['abc']).toBe(true)
  })

  it('isHidden returns false for a different video after marking one hidden', () => {
    const { result } = renderHook(() => useHiddenVideos())
    act(() => result.current.markHidden('abc'))
    expect(result.current.isHidden('xyz')).toBe(false)
  })

  it('initialises from existing localStorage data', () => {
    localStorage.setItem('bytereels_hidden', JSON.stringify({ xyz: true }))
    const { result } = renderHook(() => useHiddenVideos())
    expect(result.current.isHidden('xyz')).toBe(true)
    expect(result.current.isHidden('other')).toBe(false)
  })

  it('clearHidden resets state and removes localStorage key', () => {
    const { result } = renderHook(() => useHiddenVideos())
    act(() => result.current.markHidden('abc'))
    act(() => result.current.clearHidden())
    expect(result.current.isHidden('abc')).toBe(false)
    expect(localStorage.getItem('bytereels_hidden')).toBeNull()
  })
})
