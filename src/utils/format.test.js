import { describe, it, expect } from 'vitest'
import { formatDuration, timeAgo } from './format.js'

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(392)).toBe('6:32')
  })

  it('pads seconds to two digits', () => {
    expect(formatDuration(45)).toBe('0:45')
  })

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('formats exactly 10 minutes', () => {
    expect(formatDuration(600)).toBe('10:00')
  })

  it('formats hours when present', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('formats exactly 1 minute', () => {
    expect(formatDuration(60)).toBe('1:00')
  })

  it('does not pad minutes when no hours', () => {
    expect(formatDuration(125)).toBe('2:05')
  })
})

// ─── timeAgo ─────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  // Use a fixed reference time so tests are deterministic
  const now = new Date('2024-04-01T12:00:00Z').getTime()

  it('returns "today" for a date published today', () => {
    expect(timeAgo('2024-04-01T06:00:00Z', now)).toBe('today')
  })

  it('returns "1 day ago" for yesterday', () => {
    expect(timeAgo('2024-03-31T12:00:00Z', now)).toBe('1 day ago')
  })

  it('returns "7 days ago" for a week ago', () => {
    expect(timeAgo('2024-03-25T12:00:00Z', now)).toBe('7 days ago')
  })

  it('returns "30 days ago" for 30 days ago', () => {
    expect(timeAgo('2024-03-02T12:00:00Z', now)).toBe('30 days ago')
  })

  it('returns "" for an invalid date string', () => {
    expect(timeAgo('not-a-date', now)).toBe('')
  })

  it('returns "" for undefined', () => {
    expect(timeAgo(undefined, now)).toBe('')
  })
})
