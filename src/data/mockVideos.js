/**
 * Real YouTube video IDs for local development.
 * Set VITE_USE_MOCK=true in .env.local to use these instead of the YouTube API.
 * Titles/durations are placeholders — the videos themselves play correctly.
 * Shape must match the normalised video object from src/api/youtube.js.
 */
const mockVideos = [
  {
    id: "mBHRPeg8zPU",
    title: "Source Code",
    channelId: "mock-channel-1",
    channelName: "YouTube",
    channelTags: ["web", "ai"],
    durationSeconds: 300,
    publishedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    thumbnailUrl: "https://img.youtube.com/vi/mBHRPeg8zPU/hqdefault.jpg",
  },
  {
    id: "wfeiCZK0mNs",
    title: "Claude Killer",
    channelId: "mock-channel-2",
    channelName: "YouTube",
    channelTags: ["web"],
    durationSeconds: 300,
    publishedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    thumbnailUrl: "https://img.youtube.com/vi/wfeiCZK0mNs/hqdefault.jpg",
  },
  {
    id: "fQeybL6w-Wo",
    title: "The Next Two Years of AI",
    channelId: "mock-channel-3",
    channelName: "YouTube",
    channelTags: ["web"],
    durationSeconds: 150,
    publishedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    thumbnailUrl: "https://img.youtube.com/vi/fQeybL6w-Wo/hqdefault.jpg",
  },
  {
    id: "qaB5HF4ax9M",
    title: "Google Killed Figma",
    channelId: "mock-channel-4",
    channelName: "YouTube",
    channelTags: ["web"],
    durationSeconds: 200,
    publishedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    thumbnailUrl: "https://img.youtube.com/vi/qaB5HF4ax9M/hqdefault.jpg",
  },
  {
    id: "9g764PrwtIo",
    title: "Subtree of Another Tree",
    channelId: "mock-channel-5",
    channelName: "YouTube",
    channelTags: ["web"],
    durationSeconds: 140,
    publishedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    thumbnailUrl: "https://img.youtube.com/vi/9g764PrwtIo/hqdefault.jpg",
  },
  {
    id: "-uViRsr3QJY",
    title: "Longest String without Repeating Characters",
    channelId: "mock-channel-6",
    channelName: "YouTube",
    channelTags: ["web"],
    durationSeconds: 20,
    publishedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    thumbnailUrl: "https://img.youtube.com/vi/-uViRsr3QJY/hqdefault.jpg",
  },
];

export default mockVideos;
