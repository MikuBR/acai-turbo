import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '../components/atoms/ProductCard'

const sampleProduct = {
  id: 1,
  name: 'Açaí 500ml',
  price: 20,
  category: 'COPOS DE AÇAÍ',
}

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={sampleProduct} />)
    expect(screen.getByText('Açaí 500ml')).toBeInTheDocument()
  })

  it('renders product category', () => {
    render(<ProductCard product={sampleProduct} />)
    expect(screen.getByText('COPOS DE AÇAÍ')).toBeInTheDocument()
  })

  it('renders formatted price', () => {
    render(<ProductCard product={sampleProduct} />)
    expect(screen.getByText('R$20.00')).toBeInTheDocument()
  })

  it('renders zero price when product has no price', () => {
    render(<ProductCard product={{ id: 2, name: 'Item', category: 'CAT' }} />)
    expect(screen.getByText('R$0.00')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<ProductCard product={sampleProduct} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Açaí 500ml'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(sampleProduct)
  })

  it('returns null when no product is provided', () => {
    const { container } = render(<ProductCard product={null} />)
    expect(container.innerHTML).toBe('')
  })
})
