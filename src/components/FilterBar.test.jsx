import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import FilterBar from './FilterBar.jsx'
import useFeedStore from '../store/feedStore.js'

beforeEach(() => {
  useFeedStore.setState(useFeedStore.getInitialState())
})

// unique tags in channels.json: ai, career, css, javascript, linux, react, typescript, web (8 tags)
const EXPECTED_TAGS = ['ai', 'career', 'css', 'javascript', 'linux', 'react', 'typescript', 'web']

// Helper: open the dropdown
function openDropdown() {
  fireEvent.click(screen.getByRole('button', { name: /all topics|ai|career|css|javascript|linux|react|typescript|web/i }))
}

describe('FilterBar — trigger button', () => {
  it('shows "All topics" when no filter is active', () => {
    render(<FilterBar />)
    expect(screen.getByRole('button', { name: /all topics/i })).toBeInTheDocument()
  })

  it('shows the active filter name in the trigger', () => {
    act(() => useFeedStore.getState().setFilter('react'))
    render(<FilterBar />)
    expect(screen.getByRole('button', { name: /react/i })).toBeInTheDocument()
  })

  it('dropdown is closed by default', () => {
    render(<FilterBar />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clicking the trigger opens the dropdown', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

describe('FilterBar — chip rendering (dropdown open)', () => {
  it('renders "All" as the first option', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('All')
  })

  it('renders one option per unique tag from channels.json', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    const options = screen.getAllByRole('option')
    const labels = options.map((o) => o.textContent)
    for (const tag of EXPECTED_TAGS) {
      expect(labels).toContain(tag)
    }
  })

  it('renders exactly All + 8 tag options', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    expect(screen.getAllByRole('option')).toHaveLength(9)
  })
})

describe('FilterBar — active state', () => {
  it('"All" option has aria-pressed="true" by default', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('other options have aria-pressed="false" by default', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    expect(screen.getByRole('option', { name: 'react' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('active option reflects store activeFilter', () => {
    act(() => useFeedStore.getState().setFilter('linux'))
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /linux/i }))
    expect(screen.getByRole('option', { name: 'linux' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('FilterBar — interaction', () => {
  it('clicking a tag option calls setFilter with that tag', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    fireEvent.click(screen.getByRole('option', { name: 'react' }))
    expect(useFeedStore.getState().activeFilter).toBe('react')
  })

  it('clicking "All" option calls setFilter("all")', () => {
    act(() => useFeedStore.getState().setFilter('react'))
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /react/i }))
    fireEvent.click(screen.getByRole('option', { name: 'All' }))
    expect(useFeedStore.getState().activeFilter).toBe('all')
  })

  it('selecting an option closes the dropdown', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: /all topics/i }))
    fireEvent.click(screen.getByRole('option', { name: 'react' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
