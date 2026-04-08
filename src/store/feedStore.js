import { create } from 'zustand'
import defaultChannels from '../data/channels.json'

const CHANNELS_KEY = 'bytereels_channels'

export function loadChannels() {
  try {
    const stored = localStorage.getItem(CHANNELS_KEY)
    return stored ? JSON.parse(stored) : defaultChannels.channels
  } catch {
    return defaultChannels.channels
  }
}

function saveChannels(channels) {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels))
}

const INITIAL_STATE = {
  videos: [],
  activeFilter: 'all',
  speedFilter: 'any',
  cursor: 0,
  channels: loadChannels(),
}

const useFeedStore = create((set) => ({
  ...INITIAL_STATE,

  setVideos: (videos) => set({ videos }),

  setFilter: (filter) => {
    localStorage.setItem('activeFilter', filter)
    set({ activeFilter: filter, cursor: 0 })
  },

  setSpeedFilter: (speed) => {
    localStorage.setItem('bytereels_speed_filter', speed)
    set({ speedFilter: speed, cursor: 0 })
  },

  incrementCursor: () =>
    set((s) => ({ cursor: Math.max(0, Math.min(s.cursor + 1, s.videos.length - 1)) })),

  decrementCursor: () => set((s) => ({ cursor: Math.max(s.cursor - 1, 0) })),

  resetCursor: () => set({ cursor: 0 }),

  addChannel: (channel) =>
    set((s) => {
      if (s.channels.some((c) => c.id === channel.id)) return s
      const next = [...s.channels, channel]
      saveChannels(next)
      return { channels: next }
    }),

  removeChannel: (channelId) =>
    set((s) => {
      const next = s.channels.filter((c) => c.id !== channelId)
      saveChannels(next)
      return { channels: next }
    }),
}))

// Exposed for test resets
useFeedStore.getInitialState = () => INITIAL_STATE

export function loadPersistedFilter() {
  return localStorage.getItem('activeFilter') ?? 'all'
}

export function loadPersistedSpeedFilter() {
  return localStorage.getItem('bytereels_speed_filter') ?? 'any'
}

export default useFeedStore
