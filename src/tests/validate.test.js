import { describe, it, expect } from 'vitest'
import { validateIPC } from '../../database/validate.cjs'

describe('validateIPC', () => {
  describe('catalog:add-product', () => {
    it('accepts valid product data', () => {
      const result = validateIPC('catalog:add-product', { name: 'Açaí 500ml', price: 20, category: 'COPOS DE AÇAÍ' })
      expect(result.success).toBe(true)
      expect(result.data.price).toBe(20)
    })

    it('rejects missing name', () => {
      const result = validateIPC('catalog:add-product', { price: 20, category: 'COPOS DE AÇAÍ' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Nome')
    })

    it('rejects invalid price', () => {
      const result = validateIPC('catalog:add-product', { name: 'Test', price: -1, category: 'CAT' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Preço')
    })

    it('rejects missing category', () => {
      const result = validateIPC('catalog:add-product', { name: 'Test', price: 10 })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Categoria')
    })

    it('rejects non-object data', () => {
      expect(validateIPC('catalog:add-product', null).success).toBe(false)
      expect(validateIPC('catalog:add-product', 'string').success).toBe(false)
    })
  })

  describe('catalog:update-product', () => {
    it('accepts valid update data', () => {
      const result = validateIPC('catalog:update-product', { id: 1, product: { name: 'Test', price: 15, category: 'CAT' } })
      expect(result.success).toBe(true)
      expect(result.data.id).toBe(1)
    })

    it('rejects missing id', () => {
      const result = validateIPC('catalog:update-product', { product: { name: 'Test', price: 15, category: 'CAT' } })
      expect(result.success).toBe(false)
    })

    it('rejects invalid product', () => {
      const result = validateIPC('catalog:update-product', { id: 1, product: null })
      expect(result.success).toBe(false)
    })
  })

  describe('catalog:add-category', () => {
    it('accepts valid category name', () => {
      const result = validateIPC('catalog:add-category', 'BEBIDAS')
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      expect(validateIPC('catalog:add-category', '').success).toBe(false)
    })
  })

  describe('catalog:delete-category', () => {
    it('accepts valid id', () => {
      expect(validateIPC('catalog:delete-category', 1).success).toBe(true)
    })

    it('rejects undefined id', () => {
      expect(validateIPC('catalog:delete-category', undefined).success).toBe(false)
    })
  })

  describe('auth:login', () => {
    it('accepts valid credentials', () => {
      const result = validateIPC('auth:login', { username: 'admin', password: '1234' })
      expect(result.success).toBe(true)
    })

    it('rejects empty username', () => {
      const result = validateIPC('auth:login', { username: '', password: '1234' })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = validateIPC('auth:login', { username: 'admin', password: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('auth:change-user-password', () => {
    it('accepts valid password change', () => {
      const result = validateIPC('auth:change-user-password', { userId: 1, current: 'oldPass', new: 'newPass' })
      expect(result.success).toBe(true)
    })

    it('rejects short password', () => {
      const result = validateIPC('auth:change-user-password', { userId: 1, current: 'ab', new: 'cd' })
      expect(result.success).toBe(false)
    })
  })

  describe('users:add', () => {
    it('accepts valid user data', () => {
      const result = validateIPC('users:add', { username: 'operator1', password: '1234', full_name: 'Operador Um', role: 'operator' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid role', () => {
      const result = validateIPC('users:add', { username: 'test', password: '1234', full_name: 'Test', role: 'superadmin' })
      expect(result.success).toBe(false)
    })

    it('rejects missing full_name', () => {
      const result = validateIPC('users:add', { username: 'test', password: '1234', full_name: '', role: 'operator' })
      expect(result.success).toBe(false)
    })
  })

  describe('users:update', () => {
    it('accepts valid user update', () => {
      const result = validateIPC('users:update', { id: 1, user: { username: 'op', full_name: 'Op', role: 'operator' } })
      expect(result.success).toBe(true)
    })

    it('rejects missing id', () => {
      const result = validateIPC('users:update', { user: { username: 'op', full_name: 'Op', role: 'operator' } })
      expect(result.success).toBe(false)
    })

    it('rejects invalid role', () => {
      const result = validateIPC('users:update', { id: 1, user: { username: 'op', full_name: 'Op', role: 'invalid' } })
      expect(result.success).toBe(false)
    })
  })

  describe('cash:register', () => {
    it('accepts valid cash movement', () => {
      const result = validateIPC('cash:register', { type: 'ENTRADA', amount: 100, description: 'Venda' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = validateIPC('cash:register', { type: 'INVALID', amount: 100, description: 'Test' })
      expect(result.success).toBe(false)
    })

    it('rejects zero amount', () => {
      const result = validateIPC('cash:register', { type: 'ENTRADA', amount: 0, description: 'Test' })
      expect(result.success).toBe(false)
    })

    it('rejects missing description', () => {
      const result = validateIPC('cash:register', { type: 'ENTRADA', amount: 50, description: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('promotions:add', () => {
    it('accepts valid promotion', () => {
      const result = validateIPC('promotions:add', { name: 'Off', type: 'PERCENTAGE', value: 10, start_date: '2025-01-01', end_date: '2025-12-31' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = validateIPC('promotions:add', { name: 'Off', type: 'INVALID', value: 10, start_date: '2025-01-01', end_date: '2025-12-31' })
      expect(result.success).toBe(false)
    })

    it('rejects missing dates', () => {
      const result = validateIPC('promotions:add', { name: 'Off', type: 'PERCENTAGE', value: 10 })
      expect(result.success).toBe(false)
    })
  })

  describe('promotions:update', () => {
    it('accepts valid promotion update', () => {
      const result = validateIPC('promotions:update', { id: 1, promo: { name: 'Off', type: 'PERCENTAGE', value: 10 } })
      expect(result.success).toBe(true)
    })

    it('rejects missing id', () => {
      const result = validateIPC('promotions:update', { promo: { name: 'Off', type: 'PERCENTAGE', value: 10 } })
      expect(result.success).toBe(false)
    })

    it('rejects invalid type', () => {
      const result = validateIPC('promotions:update', { id: 1, promo: { name: 'Off', type: 'INVALID', value: 10 } })
      expect(result.success).toBe(false)
    })
  })

  describe('inventory:add', () => {
    it('accepts valid inventory data', () => {
      const result = validateIPC('inventory:add', { productId: 1, quantity: 10, unit: 'kg', minQuantity: 2 })
      expect(result.success).toBe(true)
    })

    it('rejects negative quantity', () => {
      const result = validateIPC('inventory:add', { productId: 1, quantity: -1 })
      expect(result.success).toBe(false)
    })
  })

  describe('inventory:adjust', () => {
    it('accepts valid adjustment', () => {
      const result = validateIPC('inventory:adjust', { inventoryId: 1, delta: 5 })
      expect(result.success).toBe(true)
    })

    it('rejects missing inventoryId', () => {
      const result = validateIPC('inventory:adjust', { delta: 5 })
      expect(result.success).toBe(false)
    })
  })

  describe('financial:add-account', () => {
    it('accepts valid account', () => {
      const result = validateIPC('financial:add-account', { type: 'payable', description: 'Aluguel', amount: 1500 })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = validateIPC('financial:add-account', { type: 'invalid', description: 'Test', amount: 100 })
      expect(result.success).toBe(false)
    })
  })

  describe('financial:update-account', () => {
    it('accepts valid account update', () => {
      const result = validateIPC('financial:update-account', { id: 1, account: { type: 'payable', description: 'Aluguel', amount: 1600 } })
      expect(result.success).toBe(true)
    })

    it('rejects missing id', () => {
      const result = validateIPC('financial:update-account', { account: { type: 'payable', description: 'Test', amount: 100 } })
      expect(result.success).toBe(false)
    })

    it('rejects invalid account data', () => {
      const result = validateIPC('financial:update-account', { id: 1, account: null })
      expect(result.success).toBe(false)
    })

    it('rejects invalid type in update', () => {
      const result = validateIPC('financial:update-account', { id: 1, account: { type: 'invalid', description: 'Test', amount: 100 } })
      expect(result.success).toBe(false)
    })
  })

  describe('financial:delete-account', () => {
    it('accepts valid id', () => {
      const result = validateIPC('financial:delete-account', 1)
      expect(result.success).toBe(true)
    })

    it('rejects undefined id', () => {
      expect(validateIPC('financial:delete-account', undefined).success).toBe(false)
    })

    it('rejects null id', () => {
      expect(validateIPC('financial:delete-account', null).success).toBe(false)
    })

    it('rejects NaN id', () => {
      expect(validateIPC('financial:delete-account', NaN).success).toBe(false)
    })
  })

  describe('financial:add-transaction', () => {
    it('accepts valid transaction', () => {
      const result = validateIPC('financial:add-transaction', { account_id: 1, type: 'payment', amount: 300 })
      expect(result.success).toBe(true)
    })

    it('rejects missing account_id', () => {
      const result = validateIPC('financial:add-transaction', { type: 'payment', amount: 300 })
      expect(result.success).toBe(false)
    })

    it('rejects invalid amount', () => {
      const result = validateIPC('financial:add-transaction', { account_id: 1, type: 'payment', amount: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects empty type', () => {
      const result = validateIPC('financial:add-transaction', { account_id: 1, type: '', amount: 100 })
      expect(result.success).toBe(false)
    })
  })

  describe('clients:add', () => {
    it('accepts valid client', () => {
      const result = validateIPC('clients:add', { name: 'João' })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = validateIPC('clients:add', { name: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('clients:update', () => {
    it('accepts valid client update', () => {
      const result = validateIPC('clients:update', { id: 1, client: { name: 'João Atualizado' } })
      expect(result.success).toBe(true)
    })

    it('rejects missing id', () => {
      const result = validateIPC('clients:update', { client: { name: 'Test' } })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = validateIPC('clients:update', { id: 1, client: { name: '' } })
      expect(result.success).toBe(false)
    })
  })

  describe('fallback for unknown channel', () => {
    it('passes through without validation', () => {
      const result = validateIPC('unknown:channel', { anything: true })
      expect(result.success).toBe(true)
    })
  })

  describe('catalog:delete-product', () => {
    it('accepts valid id', () => {
      expect(validateIPC('catalog:delete-product', 1).success).toBe(true)
    })
    it('rejects undefined id', () => {
      expect(validateIPC('catalog:delete-product', undefined).success).toBe(false)
    })
  })

  describe('orders:get-history', () => {
    it('accepts null params (today fallback)', () => {
      expect(validateIPC('orders:get-history', null).success).toBe(true)
    })
    it('accepts object with dates', () => {
      const result = validateIPC('orders:get-history', { startDate: '2025-01-01', endDate: '2025-12-31' })
      expect(result.success).toBe(true)
    })
    it('rejects invalid startDate', () => {
      const result = validateIPC('orders:get-history', { startDate: 123 })
      expect(result.success).toBe(false)
    })
  })

  describe('orders:delete', () => {
    it('accepts valid id', () => {
      expect(validateIPC('orders:delete', 1).success).toBe(true)
    })
    it('rejects null', () => {
      expect(validateIPC('orders:delete', null).success).toBe(false)
    })
  })

  describe('reports:by-period', () => {
    it('accepts valid period', () => {
      const result = validateIPC('reports:by-period', { startDate: '2025-01-01', endDate: '2025-12-31' })
      expect(result.success).toBe(true)
    })
    it('rejects missing startDate', () => {
      const result = validateIPC('reports:by-period', { endDate: '2025-12-31' })
      expect(result.success).toBe(false)
    })
  })

  describe('promotions:delete', () => {
    it('accepts valid id', () => {
      expect(validateIPC('promotions:delete', 1).success).toBe(true)
    })
    it('rejects undefined', () => {
      expect(validateIPC('promotions:delete', undefined).success).toBe(false)
    })
  })

  describe('users:delete', () => {
    it('accepts valid id', () => {
      expect(validateIPC('users:delete', 1).success).toBe(true)
    })
    it('rejects NaN', () => {
      expect(validateIPC('users:delete', NaN).success).toBe(false)
    })
  })

  describe('users:toggle-active', () => {
    it('accepts valid id', () => {
      expect(validateIPC('users:toggle-active', 5).success).toBe(true)
    })
    it('rejects undefined', () => {
      expect(validateIPC('users:toggle-active', undefined).success).toBe(false)
    })
  })

  describe('inventory:update-quantity', () => {
    it('accepts valid data', () => {
      const result = validateIPC('inventory:update-quantity', { inventoryId: 1, newQuantity: 20 })
      expect(result.success).toBe(true)
    })
    it('rejects negative quantity', () => {
      const result = validateIPC('inventory:update-quantity', { inventoryId: 1, newQuantity: -1 })
      expect(result.success).toBe(false)
    })
    it('rejects missing inventoryId', () => {
      const result = validateIPC('inventory:update-quantity', { newQuantity: 20 })
      expect(result.success).toBe(false)
    })
  })

  describe('inventory:get-movements', () => {
    it('accepts valid data', () => {
      const result = validateIPC('inventory:get-movements', { inventoryId: 1 })
      expect(result.success).toBe(true)
    })
    it('rejects missing inventoryId', () => {
      const result = validateIPC('inventory:get-movements', {})
      expect(result.success).toBe(false)
    })
  })

  describe('financial:get-accounts', () => {
    it('accepts empty object', () => {
      expect(validateIPC('financial:get-accounts', {}).success).toBe(true)
    })
    it('accepts valid filters', () => {
      const result = validateIPC('financial:get-accounts', { type: 'payable' })
      expect(result.success).toBe(true)
    })
  })

  describe('financial:get-summary', () => {
    it('accepts empty params', () => {
      expect(validateIPC('financial:get-summary', {}).success).toBe(true)
    })
    it('accepts valid date range', () => {
      const result = validateIPC('financial:get-summary', { startDate: '2025-01-01', endDate: '2025-12-31' })
      expect(result.success).toBe(true)
    })
  })

  describe('config:update', () => {
    it('accepts valid config', () => {
      const result = validateIPC('config:update', { key: 'printer_kitchen_ip', value: '192.168.1.200' })
      expect(result.success).toBe(true)
    })
    it('rejects empty key', () => {
      const result = validateIPC('config:update', { key: '', value: 'test' })
      expect(result.success).toBe(false)
    })
    it('blocks manager_password key', () => {
      const result = validateIPC('config:update', { key: 'manager_password', value: 'newpass' })
      expect(result.success).toBe(false)
    })
  })

  describe('clients:delete', () => {
    it('accepts valid id', () => {
      expect(validateIPC('clients:delete', 3).success).toBe(true)
    })
    it('rejects null', () => {
      expect(validateIPC('clients:delete', null).success).toBe(false)
    })
  })

  describe('clients:get-orders', () => {
    it('accepts valid client id', () => {
      expect(validateIPC('clients:get-orders', 1).success).toBe(true)
    })
    it('rejects undefined', () => {
      expect(validateIPC('clients:get-orders', undefined).success).toBe(false)
    })
  })

  describe('clients:add-order', () => {
    it('accepts valid data', () => {
      const result = validateIPC('clients:add-order', { clientId: 1, orderId: 10, totalAmount: 50 })
      expect(result.success).toBe(true)
    })
    it('rejects missing clientId', () => {
      const result = validateIPC('clients:add-order', { orderId: 10, totalAmount: 50 })
      expect(result.success).toBe(false)
    })
    it('rejects negative total', () => {
      const result = validateIPC('clients:add-order', { clientId: 1, orderId: 10, totalAmount: -5 })
      expect(result.success).toBe(false)
    })
  })

  describe('audit:get-logs', () => {
    it('accepts valid limit', () => {
      const result = validateIPC('audit:get-logs', 50)
      expect(result.success).toBe(true)
    })
    it('accepts null limit (default 100)', () => {
      const result = validateIPC('audit:get-logs', null)
      expect(result.success).toBe(true)
    })
    it('rejects invalid limit', () => {
      const result = validateIPC('audit:get-logs', -1)
      expect(result.success).toBe(false)
    })
  })
})
