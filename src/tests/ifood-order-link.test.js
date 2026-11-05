import { describe, it, expect } from 'vitest'

import {
  saveFullOrder,
  getOrderByIfoodOrderId,
  updateOrderStatus,
  db,
} from '../../database/db.cjs'

describe('ifood-order-link — regressão (comanda vinculada ao iFood)', () => {
  const itens = [
    { name: 'Açaí 500ml', price: 18.9, notes: '', category: 'iFOOD' },
    { name: 'Banana', price: 5.0, notes: 'Adicionais doces', category: 'iFOOD' },
  ]

  it('saveFullOrder aceita ifoodOrderId e armazena na coluna orders.ifood_order_id', () => {
    const orderId = saveFullOrder(
      {
        tableName: 'iFood #123',
        customerName: 'Cliente iFood',
        total: 23.9,
        isDelivery: 1,
        address: 'Rua A, 123, Bairro, Cidade, SP',
        phone: '(11) 99999-9999',
        paymentMethod: 'IFOOD',
        ifoodOrderId: 'ifood_ord_abc123',
        payments: [{ method: 'IFOOD', amount: 23.9 }],
      },
      itens,
    )
    expect(orderId).toBeGreaterThan(0)

    const row = getOrderByIfoodOrderId('ifood_ord_abc123')
    expect(row).not.toBeNull()
    expect(row.ifood_order_id).toBe('ifood_ord_abc123')
    expect(row.customer_name).toBe('Cliente iFood')
    expect(row.total).toBe(23.9)
    expect(row.is_delivery).toBe(1)

    const itensDb = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)
    expect(itensDb).toHaveLength(2)
    expect(itensDb[0].product_name).toBe('Açaí 500ml')
  })

  it('getOrderByIfoodOrderId retorna null quando não existe', () => {
    expect(getOrderByIfoodOrderId('nao_existe')).toBeNull()
  })

  it('updateOrderStatus atualiza o status do pedido vinculado', () => {
    const orderId = saveFullOrder(
      {
        tableName: 'iFood #999',
        customerName: 'Cliente X',
        total: 10,
        isDelivery: 1,
        address: 'End',
        phone: 'Fone',
        paymentMethod: 'IFOOD',
        ifoodOrderId: 'ifood_ord_xyz',
        payments: [{ method: 'IFOOD', amount: 10 }],
      },
      [{ name: 'Item', price: 10, notes: '', category: 'iFOOD' }],
    )
    expect(updateOrderStatus(orderId, 'ready')).toBe(true)
    const row = getOrderByIfoodOrderId('ifood_ord_xyz')
    expect(row.status).toBe('ready')
  })
})
