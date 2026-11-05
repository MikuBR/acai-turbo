import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Regression T2: DINHEIRO duplicado no relatório de vendas.
// getReportByPeriod / getDailyReport / getDailyReportForDate agrupavam por
// (payment_method, is_delivery), criando linhas separadas para o mesmo
// payment_method quando há pedido de balcão e de delivery. Agora agrupam só
// por payment_method.

const TEST_DATE = '2031-05-15' // data isolada, sem colisão com dados reais
const MARKER = 'T2-DINHEIRO-DEDUP'

describe('sales report agrupa por payment_method apenas (T2)', () => {
  let dbModule
  let insertedIds = []

  beforeAll(async () => {
    dbModule = await import('../../database/db.cjs')
    const db = dbModule.db
    const insert = db.prepare(`
      INSERT INTO orders (customer_name, total, payment_method, is_delivery, is_exchange, created_at)
      VALUES (?, ?, 'DINHEIRO', ?, 0, ?)
    `)
    const t = `${TEST_DATE} 12:00:00`
    insertedIds.push(insert.run(`${MARKER}-balcao`, 10, 0, t).lastInsertRowid)
    insertedIds.push(insert.run(`${MARKER}-delivery`, 15, 1, t).lastInsertRowid)
  })

  afterAll(() => {
    const db = dbModule.db
    const del = db.prepare('DELETE FROM orders WHERE customer_name LIKE ?')
    del.run(`${MARKER}-%`)
  })

  function dinheiroRows(sales) {
    return sales.filter(s => s.payment_method === 'DINHEIRO')
  }

  it('getReportByPeriod retorna 1 linha DINHEIRO com order_count=2', () => {
    const report = dbModule.getReportByPeriod(TEST_DATE, TEST_DATE)
    const rows = dinheiroRows(report.sales)
    expect(rows).toHaveLength(1)
    expect(rows[0].order_count).toBe(2)
    expect(rows[0].total_amount).toBeCloseTo(25, 5)
  })

  it('getDailyReportForDate retorna 1 linha DINHEIRO com order_count=2', () => {
    const report = dbModule.getDailyReportForDate(TEST_DATE)
    const rows = dinheiroRows(report.sales)
    expect(rows).toHaveLength(1)
    expect(rows[0].order_count).toBe(2)
    expect(rows[0].total_amount).toBeCloseTo(25, 5)
  })

  it('shape de retorno mantém payment_method, total_amount e order_count', () => {
    const report = dbModule.getReportByPeriod(TEST_DATE, TEST_DATE)
    const row = dinheiroRows(report.sales)[0]
    expect(row).toMatchObject({ payment_method: 'DINHEIRO', order_count: 2 })
    expect(typeof row.total_amount).toBe('number')
  })
})
