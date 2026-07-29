import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '../components/atoms/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Ativo</Badge>)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.firstChild.className).toContain('bg-surface-light')
    expect(container.firstChild.className).toContain('text-muted')
  })

  it('applies primary variant', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>)
    expect(container.firstChild.className).toContain('bg-success/10')
    expect(container.firstChild.className).toContain('text-success')
    expect(container.firstChild.className).toContain('border-success/30')
  })

  it('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">Danger</Badge>)
    expect(container.firstChild.className).toContain('bg-danger/10')
  })

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    expect(container.firstChild.className).toContain('bg-warning/10')
  })

  it('applies info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>)
    expect(container.firstChild.className).toContain('bg-info/10')
  })

  it('applies purple variant', () => {
    const { container } = render(<Badge variant="purple">Purple</Badge>)
    expect(container.firstChild.className).toContain('bg-purple-600/10')
  })

  it('applies yellow variant', () => {
    const { container } = render(<Badge variant="yellow">Yellow</Badge>)
    expect(container.firstChild.className).toContain('bg-yellow-500/10')
  })

  it('fallback to default for unknown variant', () => {
    const { container } = render(<Badge variant="unknown">Fallback</Badge>)
    expect(container.firstChild.className).toContain('bg-surface-light')
  })

  it('applies sm size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>)
    expect(container.firstChild.className).toContain('text-[8px]')
  })

  it('applies md size as default', () => {
    const { container } = render(<Badge>Medium</Badge>)
    expect(container.firstChild.className).toContain('text-[9px]')
  })

  it('applies lg size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>)
    expect(container.firstChild.className).toContain('text-[10px]')
  })

  it('fallback to md for unknown size', () => {
    const { container } = render(<Badge size="xl">Fallback</Badge>)
    expect(container.firstChild.className).toContain('text-[9px]')
  })

  it('merges custom className', () => {
    const { container } = render(<Badge className="custom-badge">Custom</Badge>)
    expect(container.firstChild.className).toContain('custom-badge')
  })
})
