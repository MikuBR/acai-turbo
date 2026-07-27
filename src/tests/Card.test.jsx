import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from '../components/atoms/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('applies default padding', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild.className).toContain('p-4')
  })

  it('applies hover styles when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>)
    expect(container.firstChild.className).toContain('hover:border-primary')
  })

  it('merges custom className', () => {
    const { container } = render(<Card className="my-card">Content</Card>)
    expect(container.firstChild.className).toContain('my-card')
  })
})
