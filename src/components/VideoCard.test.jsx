import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VideoCard from './VideoCard.jsx'
import { formatDuration, timeAgo } from '../utils/format.js'

vi.mock('./YouTubeEmbed.jsx', () => ({
  default: () => <div data-testid="youtube-embed" />,
}))

const video = {
  id: 'abc123',
  title: 'How Vite Works Under the Hood',
  channelId: 'UCVhQ2NnY5Rskt6UjCUkJ_DA',
  channelName: 'Fireship',
  channelTags: ['web', 'javascript'],
  durationSeconds: 392,
  publishedAt: '2024-03-15T12:00:00Z',
  thumbnailUrl: 'https://img.example.com/thumb.jpg',
}

describe('VideoCard', () => {
  it('renders the video title', () => {
    render(<VideoCard video={video} isActive={false} />)
    expect(screen.getByText('How Vite Works Under the Hood')).toBeInTheDocument()
  })

  it('renders the channel name', () => {
    render(<VideoCard video={video} isActive={false} />)
    expect(screen.getByText('Fireship')).toBeInTheDocument()
  })

  it('renders the formatted duration', () => {
    render(<VideoCard video={video} isActive={false} />)
    expect(screen.getByText(new RegExp(formatDuration(392)))).toBeInTheDocument()
  })

  it('renders the relative time', () => {
    render(<VideoCard video={video} isActive={false} />)
    // timeAgo uses real Date.now() — just assert something truthy is rendered
    const expected = timeAgo(video.publishedAt)
    expect(screen.getByText(new RegExp(expected))).toBeInTheDocument()
  })

  it('renders a tag chip for each channelTag', () => {
    render(<VideoCard video={video} isActive={false} />)
    const chips = screen.getAllByTestId('tag-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveTextContent('web')
    expect(chips[1]).toHaveTextContent('javascript')
  })

  it('renders the YouTubeEmbed stub', () => {
    render(<VideoCard video={video} isActive={true} />)
    expect(screen.getByTestId('youtube-embed')).toBeInTheDocument()
  })

  it('does not render a watched indicator when isWatched is omitted', () => {
    render(<VideoCard video={video} isActive={false} />)
    expect(screen.queryByTestId('watched-indicator')).not.toBeInTheDocument()
  })

  it('renders a watched indicator when isWatched is true', () => {
    render(<VideoCard video={video} isActive={false} isWatched={true} />)
    expect(screen.getByTestId('watched-indicator')).toBeInTheDocument()
  })

  it('does not render Not Interested button when onNotInterested is omitted', () => {
    render(<VideoCard video={video} isActive={false} />)
    expect(screen.queryByRole('button', { name: /not interested/i })).not.toBeInTheDocument()
  })

  it('renders Not Interested button when onNotInterested is provided', () => {
    render(<VideoCard video={video} isActive={false} onNotInterested={() => {}} />)
    expect(screen.getByRole('button', { name: /not interested/i })).toBeInTheDocument()
  })

  it('calls onNotInterested when the button is clicked', () => {
    const handler = vi.fn()
    render(<VideoCard video={video} isActive={false} onNotInterested={handler} />)
    fireEvent.click(screen.getByRole('button', { name: /not interested/i }))
    expect(handler).toHaveBeenCalledOnce()
  })
})
