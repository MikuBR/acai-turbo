import { describe, it, expect } from 'vitest'
import { validateIPC } from '../../database/validate.cjs'

describe('validate: IFOOD payment method (T3 regression)', () => {
  it('aceita paymentMethod IFOOD no formato legado', () => {
    const r = validateIPC('orders:save', {
      orderData: { tableName: 'iFood #1', total: 25, paymentMethod: 'IFOOD', ifoodOrderId: 'abc123' },
      items: [{ name: 'Item', price: 25 }],
    })
    expect(r.success).toBe(true)
  })

  it('aceita payments com method IFOOD no formato novo', () => {
    const r = validateIPC('orders:save', {
      orderData: { tableName: 'iFood #1', total: 25, payments: [{ method: 'IFOOD', amount: 25 }], ifoodOrderId: 'abc123' },
      items: [{ name: 'Item', price: 25 }],
    })
    expect(r.success).toBe(true)
  })

  it('rejeita ifoodOrderId não-string', () => {
    const r = validateIPC('orders:save', {
      orderData: { tableName: 'X', total: 10, payments: [{ method: 'PIX', amount: 10 }], ifoodOrderId: 12345 },
      items: [{ name: 'Item', price: 10 }],
    })
    expect(r.success).toBe(false)
  })

  it('rejeita ifoodOrderId muito longo', () => {
    const r = validateIPC('orders:save', {
      orderData: { tableName: 'X', total: 10, payments: [{ method: 'PIX', amount: 10 }], ifoodOrderId: 'x'.repeat(101) },
      items: [{ name: 'Item', price: 10 }],
    })
    expect(r.success).toBe(false)
  })
})
