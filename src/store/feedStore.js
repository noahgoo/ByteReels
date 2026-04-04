import { create } from 'zustand'

const INITIAL_STATE = {
  videos: [],
  activeFilter: 'all',
  cursor: 0,
}

const useFeedStore = create((set) => ({
  ...INITIAL_STATE,

  setVideos: (videos) => set({ videos }),

  setFilter: (filter) => set({ activeFilter: filter, cursor: 0 }),

  incrementCursor: () =>
    set((s) => ({ cursor: Math.max(0, Math.min(s.cursor + 1, s.videos.length - 1)) })),

  decrementCursor: () => set((s) => ({ cursor: Math.max(s.cursor - 1, 0) })),

  resetCursor: () => set({ cursor: 0 }),
}))

// Exposed for test resets
useFeedStore.getInitialState = () => INITIAL_STATE

export default useFeedStore
