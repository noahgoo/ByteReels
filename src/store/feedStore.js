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

  incrementCursor: () => set((s) => ({ cursor: s.cursor + 1 })),

  resetCursor: () => set({ cursor: 0 }),
}))

// Exposed for test resets
useFeedStore.getInitialState = () => INITIAL_STATE

export default useFeedStore
