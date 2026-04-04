import { describe, it, expect } from 'vitest'
import {
  parseDuration,
  isUnderTenMinutes,
  filterVideos,
  getCacheKey,
  normalizeVideo,
} from './youtube.js'

// ─── parseDuration ────────────────────────────────────────────────────────────

describe('parseDuration', () => {
  it('parses minutes and seconds', () => {
    expect(parseDuration('PT6M32S')).toBe(392)
  })

  it('parses exactly 10 minutes', () => {
    expect(parseDuration('PT10M0S')).toBe(600)
  })

  it('parses seconds only', () => {
    expect(parseDuration('PT45S')).toBe(45)
  })

  it('parses hours, minutes, and seconds', () => {
    expect(parseDuration('PT1H2M3S')).toBe(3723)
  })

  it('parses minutes only (no seconds)', () => {
    expect(parseDuration('PT5M')).toBe(300)
  })

  it('parses hours only', () => {
    expect(parseDuration('PT1H')).toBe(3600)
  })

  it('returns 0 for empty or invalid string', () => {
    expect(parseDuration('')).toBe(0)
    expect(parseDuration('invalid')).toBe(0)
  })
})

// ─── isUnderTenMinutes ────────────────────────────────────────────────────────

describe('isUnderTenMinutes', () => {
  it('returns true for PT9M59S', () => {
    expect(isUnderTenMinutes('PT9M59S')).toBe(true)
  })

  it('returns false for PT10M0S (boundary — excluded)', () => {
    expect(isUnderTenMinutes('PT10M0S')).toBe(false)
  })

  it('returns false for PT10M1S', () => {
    expect(isUnderTenMinutes('PT10M1S')).toBe(false)
  })

  it('returns true for a short video', () => {
    expect(isUnderTenMinutes('PT2M30S')).toBe(true)
  })

  it('returns false for a long video', () => {
    expect(isUnderTenMinutes('PT1H30M')).toBe(false)
  })
})

// ─── filterVideos ─────────────────────────────────────────────────────────────

describe('filterVideos', () => {
  const makeItem = (id, duration) => ({
    id,
    contentDetails: { duration },
    snippet: {
      title: `Video ${id}`,
      channelId: 'ch1',
      publishedAt: '2024-01-01T00:00:00Z',
      thumbnails: { high: { url: 'https://img.example.com/thumb.jpg' } },
    },
  })

  it('keeps videos strictly under 10 minutes', () => {
    const items = [makeItem('a', 'PT5M'), makeItem('b', 'PT9M59S')]
    expect(filterVideos(items)).toHaveLength(2)
  })

  it('removes videos at exactly 10 minutes', () => {
    const items = [makeItem('a', 'PT10M0S')]
    expect(filterVideos(items)).toHaveLength(0)
  })

  it('removes videos over 10 minutes', () => {
    const items = [makeItem('a', 'PT15M'), makeItem('b', 'PT1H')]
    expect(filterVideos(items)).toHaveLength(0)
  })

  it('handles a mixed list correctly', () => {
    const items = [
      makeItem('short', 'PT3M'),
      makeItem('boundary', 'PT10M0S'),
      makeItem('long', 'PT20M'),
      makeItem('under', 'PT9M59S'),
    ]
    const result = filterVideos(items)
    expect(result).toHaveLength(2)
    expect(result.map((v) => v.id)).toEqual(['short', 'under'])
  })

  it('returns empty array for empty input', () => {
    expect(filterVideos([])).toEqual([])
  })
})

// ─── getCacheKey ──────────────────────────────────────────────────────────────

describe('getCacheKey', () => {
  it('returns a deterministic string for a channel id', () => {
    expect(getCacheKey('UCVhQ2NnY5Rskt6UjCUkJ_DA')).toBe(
      'bytereels_cache_UCVhQ2NnY5Rskt6UjCUkJ_DA'
    )
  })

  it('returns different keys for different channel ids', () => {
    expect(getCacheKey('ch1')).not.toBe(getCacheKey('ch2'))
  })
})

// ─── normalizeVideo ───────────────────────────────────────────────────────────

describe('normalizeVideo', () => {
  const rawItem = {
    id: 'vid123',
    contentDetails: { duration: 'PT6M32S' },
    snippet: {
      title: 'How to use React Hooks',
      channelId: 'ch1',
      publishedAt: '2024-03-15T12:00:00Z',
      thumbnails: { high: { url: 'https://img.example.com/thumb.jpg' } },
    },
  }

  it('maps raw API item to normalised shape', () => {
    const result = normalizeVideo(rawItem, 'MyChannel', ['react', 'web'])
    expect(result).toEqual({
      id: 'vid123',
      title: 'How to use React Hooks',
      channelId: 'ch1',
      channelName: 'MyChannel',
      channelTags: ['react', 'web'],
      durationSeconds: 392,
      publishedAt: '2024-03-15T12:00:00Z',
      thumbnailUrl: 'https://img.example.com/thumb.jpg',
    })
  })
})
