import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Select from '../components/atoms/Select'

describe('Select', () => {
  it('renders select element', () => {
    render(<Select />)
    expect(document.querySelector('select')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Select label="Categoria" />)
    expect(screen.getByText('Categoria')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    const { container } = render(<Select />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('renders children options', () => {
    render(<Select><option value="1">Opção 1</option><option value="2">Opção 2</option></Select>)
    expect(screen.getByText('Opção 1')).toBeInTheDocument()
    expect(screen.getByText('Opção 2')).toBeInTheDocument()
  })

  it('merges custom className', () => {
    render(<Select className="custom-class" />)
    const select = document.querySelector('select')
    expect(select.className).toContain('custom-class')
  })

  it('passes additional props to select', () => {
    render(<Select disabled />)
    const select = document.querySelector('select')
    expect(select.disabled).toBe(true)
  })
})
