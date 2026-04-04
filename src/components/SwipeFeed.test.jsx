import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SwipeFeed from './SwipeFeed.jsx'
import useFeedStore from '../store/feedStore.js'

vi.mock('./VideoCard.jsx', () => ({
  default: ({ video, isActive }) => (
    <div data-testid="video-card" data-active={String(isActive)}>
      {video.title}
    </div>
  ),
}))

// react-swipeable uses pointer events; provide a minimal stub
vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({ ref: () => {} }),
}))

const makeVideo = (n) => ({
  id: `v${n}`,
  title: `Video ${n}`,
  channelId: 'ch1',
  channelName: 'Test Channel',
  channelTags: ['web'],
  durationSeconds: 120,
  publishedAt: '2024-01-01T00:00:00Z',
  thumbnailUrl: '',
})

beforeEach(() => {
  useFeedStore.setState(useFeedStore.getInitialState())
})

describe('SwipeFeed', () => {
  it('renders a loading state when videos is empty', () => {
    render(<SwipeFeed />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders a card for each video', () => {
    useFeedStore.setState({ videos: [makeVideo(1), makeVideo(2), makeVideo(3)] })
    render(<SwipeFeed />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(3)
  })

  it('passes isActive=true only to the card at the current cursor', () => {
    useFeedStore.setState({ videos: [makeVideo(1), makeVideo(2), makeVideo(3)], cursor: 0 })
    render(<SwipeFeed />)
    const cards = screen.getAllByTestId('video-card')
    expect(cards[0]).toHaveAttribute('data-active', 'true')
    expect(cards[1]).toHaveAttribute('data-active', 'false')
    expect(cards[2]).toHaveAttribute('data-active', 'false')
  })

  it('marks the card at cursor=1 as active', () => {
    useFeedStore.setState({ videos: [makeVideo(1), makeVideo(2), makeVideo(3)], cursor: 1 })
    render(<SwipeFeed />)
    const cards = screen.getAllByTestId('video-card')
    expect(cards[0]).toHaveAttribute('data-active', 'false')
    expect(cards[1]).toHaveAttribute('data-active', 'true')
  })

  it('ArrowDown increments the cursor', () => {
    useFeedStore.setState({ videos: [makeVideo(1), makeVideo(2)], cursor: 0 })
    render(<SwipeFeed />)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(useFeedStore.getState().cursor).toBe(1)
  })

  it('ArrowUp decrements the cursor', () => {
    useFeedStore.setState({ videos: [makeVideo(1), makeVideo(2), makeVideo(3)], cursor: 2 })
    render(<SwipeFeed />)
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(useFeedStore.getState().cursor).toBe(1)
  })

  it('ArrowDown does not go past the last video', () => {
    useFeedStore.setState({ videos: [makeVideo(1)], cursor: 0 })
    render(<SwipeFeed />)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(useFeedStore.getState().cursor).toBe(0)
  })

  it('ArrowUp does not go below 0', () => {
    useFeedStore.setState({ videos: [makeVideo(1), makeVideo(2)], cursor: 0 })
    render(<SwipeFeed />)
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(useFeedStore.getState().cursor).toBe(0)
  })
})
