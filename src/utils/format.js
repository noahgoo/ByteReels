const pad = (n) => String(n).padStart(2, '0')

/**
 * Format a duration in seconds to a YouTube-style string.
 * Under 1 hour: "m:SS" (minutes not zero-padded)
 * 1 hour or more: "h:MM:SS"
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}

/**
 * Return a human-readable relative time string.
 * @param {string} isoString - ISO 8601 date string
 * @param {number} [now=Date.now()] - Reference timestamp (injectable for testing)
 * @returns {string}
 */
export function timeAgo(isoString, now = Date.now()) {
  if (!isoString) return ''
  const ms = now - new Date(isoString).getTime()
  if (isNaN(ms)) return ''
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}
