const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// ─── Duration utilities ───────────────────────────────────────────────────────

/**
 * Parse an ISO 8601 duration string (e.g. "PT6M32S") into total seconds.
 * @param {string} iso8601
 * @returns {number}
 */
export function parseDuration(iso8601) {
  if (!iso8601) return 0
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] ?? '0', 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const seconds = parseInt(match[3] ?? '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Returns true if the ISO 8601 duration is strictly under 10 minutes (600s).
 * @param {string} iso8601
 * @returns {boolean}
 */
export function isUnderTenMinutes(iso8601) {
  return parseDuration(iso8601) < 600
}

// ─── Video normalisation ──────────────────────────────────────────────────────

/**
 * Normalise a raw `videos.list` item into the app's video shape.
 * @param {object} item - Raw API item with snippet + contentDetails
 * @param {string} channelName
 * @param {string[]} channelTags
 * @returns {object}
 */
export function normalizeVideo(item, channelName, channelTags) {
  return {
    id: item.id,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelName,
    channelTags,
    durationSeconds: parseDuration(item.contentDetails.duration),
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl: item.snippet.thumbnails?.high?.url ?? '',
  }
}

/**
 * Filter a list of raw `videos.list` items to those strictly under 10 minutes.
 * @param {object[]} items
 * @returns {object[]}
 */
export function filterVideos(items) {
  return items.filter((item) => isUnderTenMinutes(item.contentDetails.duration))
}

// ─── Persistent cache (localStorage, 24-hour TTL) ────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_PREFIX = 'bytereels_cache_'

export function getCacheKey(channelId) {
  return `${CACHE_PREFIX}${channelId}`
}

function readCache(channelId) {
  try {
    const raw = localStorage.getItem(getCacheKey(channelId))
    if (!raw) return null
    const { data, fetchedAt } = JSON.parse(raw)
    if (Date.now() - fetchedAt > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(channelId))
      return null
    }
    return data
  } catch {
    return null
  }
}

function writeCache(channelId, data) {
  try {
    localStorage.setItem(getCacheKey(channelId), JSON.stringify({ data, fetchedAt: Date.now() }))
  } catch {
    // localStorage full or unavailable — skip caching silently
  }
}

/**
 * Clear all cached video data. Call before a forced refresh so
 * fetchVideosForChannel hits the API instead of returning stale data.
 */
export function clearVideoCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}

// ─── API fetching ─────────────────────────────────────────────────────────────

/**
 * Fetch all video IDs for a channel using search.list.
 * Makes two calls — one for `short` (<4 min) and one for `medium` (4–20 min) —
 * then deduplicates and returns the combined id list.
 */
async function searchVideoIds(channelId, maxResults, apiKey) {
  const params = new URLSearchParams({
    part: 'id',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: String(maxResults),
    key: apiKey,
  })

  const fetchBucket = async (videoDuration) => {
    const res = await fetch(
      `${BASE_URL}/search?${params}&videoDuration=${videoDuration}`
    )
    if (!res.ok) throw new Error(`search.list failed: ${res.status}`)
    const data = await res.json()
    return (data.items ?? []).map((item) => item.id.videoId).filter(Boolean)
  }

  const [shortIds, mediumIds] = await Promise.all([
    fetchBucket('short'),
    fetchBucket('medium'),
  ])

  // Deduplicate while preserving order (short first)
  return [...new Set([...shortIds, ...mediumIds])]
}

/**
 * Fetch full video details (snippet + contentDetails) for a batch of IDs.
 */
async function fetchVideoDetails(videoIds, apiKey) {
  if (videoIds.length === 0) return []
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: videoIds.join(','),
    key: apiKey,
  })
  const res = await fetch(`${BASE_URL}/videos?${params}`)
  if (!res.ok) throw new Error(`videos.list failed: ${res.status}`)
  const data = await res.json()
  return data.items ?? []
}

/**
 * Fetch, filter, and normalise videos for a single channel.
 * Results are cached in sessionStorage for the duration of the session.
 *
 * @param {object} channel - { id, name, tags, maxResults }
 * @param {string} apiKey
 * @returns {Promise<object[]>} Normalised video list
 */
export async function fetchVideosForChannel(channel, apiKey) {
  const cached = readCache(channel.id)
  if (cached) return cached

  const videoIds = await searchVideoIds(channel.id, channel.maxResults ?? 10, apiKey)
  const rawItems = await fetchVideoDetails(videoIds, apiKey)
  const filtered = filterVideos(rawItems)
  const normalised = filtered.map((item) =>
    normalizeVideo(item, channel.name, channel.tags)
  )

  writeCache(channel.id, normalised)
  return normalised
}

/**
 * Resolve a YouTube channel URL, @handle, or channel ID to { id, name }.
 * Accepts:
 *   https://youtube.com/@fireship
 *   @fireship
 *   UCVhQ2NnY5Rskt6UjCUkJ_DA
 *   https://youtube.com/channel/UCVhQ2NnY5Rskt6UjCUkJ_DA
 *
 * @param {string} input
 * @param {string} apiKey
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function resolveChannel(input, apiKey) {
  const clean = input.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, '')

  const params = new URLSearchParams({ part: 'snippet', key: apiKey })

  if (clean.startsWith('channel/')) {
    params.set('id', clean.slice('channel/'.length))
  } else if (/^UC[\w-]{22}$/.test(clean)) {
    params.set('id', clean)
  } else {
    // @handle, bare handle, or /c/ /user/ paths — normalise to forHandle
    const handle = clean.startsWith('@') ? clean : '@' + clean.replace(/^(c|user)\//, '')
    params.set('forHandle', handle)
  }

  const res = await fetch(`${BASE_URL}/channels?${params}`)
  if (!res.ok) throw new Error(`channels.list failed: ${res.status}`)
  const data = await res.json()

  const item = data.items?.[0]
  if (!item) throw new Error('Channel not found')

  return { id: item.id, name: item.snippet.title }
}

/**
 * Fetch videos for all channels and return a flat, deduplicated list sorted
 * by publishedAt descending.
 *
 * @param {object[]} channels - Array of channel objects from channels.json
 * @param {string} apiKey
 * @returns {Promise<object[]>}
 */
export async function fetchAllVideos(channels, apiKey) {
  const results = await Promise.allSettled(
    channels.map((ch) => fetchVideosForChannel(ch, apiKey))
  )

  const allVideos = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))

  // Deduplicate by video id, sort newest first
  const seen = new Set()
  return allVideos
    .filter((v) => {
      if (seen.has(v.id)) return false
      seen.add(v.id)
      return true
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}
