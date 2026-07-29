import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Input from '../components/atoms/Input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />)
    expect(document.querySelector('input')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Input label="Nome" />)
    expect(screen.getByText('Nome')).toBeInTheDocument()
  })

  it('renders error message when provided', () => {
    render(<Input error="Campo obrigatório" />)
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('does not render error when not provided', () => {
    render(<Input />)
    expect(document.querySelector('.text-red-500')).toBeNull()
  })

  it('applies error styles when error is present', () => {
    render(<Input error="Erro" />)
    const input = document.querySelector('input')
    expect(input.className).toContain('border-red-500')
  })

  it('merges custom className', () => {
    render(<Input className="custom-class" />)
    const input = document.querySelector('input')
    expect(input.className).toContain('custom-class')
  })

  it('passes additional props to input', () => {
    render(<Input placeholder="Digite aqui" type="number" />)
    const input = document.querySelector('input')
    expect(input.placeholder).toBe('Digite aqui')
    expect(input.type).toBe('number')
  })
})
