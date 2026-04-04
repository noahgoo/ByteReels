import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

// Re-import the store fresh before each test to avoid state bleed between tests
let useFeedStore

beforeEach(async () => {
  // Reset module registry so each test gets a clean Zustand store
  const mod = await import('./feedStore.js?t=' + Date.now())
  useFeedStore = mod.default
  // Reset the store to initial state
  useFeedStore.setState(useFeedStore.getInitialState())
})

// ─── Initial state ────────────────────────────────────────────────────────────

describe('feedStore — initial state', () => {
  it('has an empty videos array', () => {
    expect(useFeedStore.getState().videos).toEqual([])
  })

  it('has activeFilter set to "all"', () => {
    expect(useFeedStore.getState().activeFilter).toBe('all')
  })

  it('has cursor set to 0', () => {
    expect(useFeedStore.getState().cursor).toBe(0)
  })
})

// ─── setVideos ────────────────────────────────────────────────────────────────

describe('feedStore — setVideos', () => {
  it('replaces the videos list', () => {
    const videos = [{ id: 'v1' }, { id: 'v2' }]
    act(() => useFeedStore.getState().setVideos(videos))
    expect(useFeedStore.getState().videos).toEqual(videos)
  })

  it('can clear videos by setting an empty array', () => {
    act(() => useFeedStore.getState().setVideos([{ id: 'v1' }]))
    act(() => useFeedStore.getState().setVideos([]))
    expect(useFeedStore.getState().videos).toEqual([])
  })
})

// ─── setFilter ────────────────────────────────────────────────────────────────

describe('feedStore — setFilter', () => {
  it('updates activeFilter', () => {
    act(() => useFeedStore.getState().setFilter('react'))
    expect(useFeedStore.getState().activeFilter).toBe('react')
  })

  it('resets cursor to 0 when filter changes', () => {
    act(() => useFeedStore.getState().incrementCursor())
    act(() => useFeedStore.getState().incrementCursor())
    act(() => useFeedStore.getState().setFilter('linux'))
    expect(useFeedStore.getState().cursor).toBe(0)
  })

  it('setting filter to "all" resets to default', () => {
    act(() => useFeedStore.getState().setFilter('react'))
    act(() => useFeedStore.getState().setFilter('all'))
    expect(useFeedStore.getState().activeFilter).toBe('all')
  })
})

// ─── incrementCursor ─────────────────────────────────────────────────────────

describe('feedStore — incrementCursor', () => {
  it('increments cursor by 1', () => {
    act(() => useFeedStore.getState().incrementCursor())
    expect(useFeedStore.getState().cursor).toBe(1)
  })

  it('increments cursor multiple times', () => {
    act(() => useFeedStore.getState().incrementCursor())
    act(() => useFeedStore.getState().incrementCursor())
    act(() => useFeedStore.getState().incrementCursor())
    expect(useFeedStore.getState().cursor).toBe(3)
  })
})

// ─── resetCursor ─────────────────────────────────────────────────────────────

describe('feedStore — resetCursor', () => {
  it('resets cursor back to 0', () => {
    act(() => useFeedStore.getState().incrementCursor())
    act(() => useFeedStore.getState().incrementCursor())
    act(() => useFeedStore.getState().resetCursor())
    expect(useFeedStore.getState().cursor).toBe(0)
  })
})
