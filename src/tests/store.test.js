import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store/useStore'

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      activeTableId: 1,
      tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }],
      catalog: [],
    })
  })

  it('starts with one default table', () => {
    const state = useStore.getState()
    expect(state.tables).toHaveLength(1)
    expect(state.tables[0].name).toBe('BALCÃO')
    expect(state.activeTableId).toBe(1)
  })

  it('setCatalog updates catalog', () => {
    useStore.getState().setCatalog([{ id: 1, name: 'Açaí', price: 15 }])
    expect(useStore.getState().catalog).toHaveLength(1)
  })

  it('setActiveTable changes active table', () => {
    useStore.setState({ tables: [{ id: 1 }, { id: 2 }] })
    useStore.getState().setActiveTable(2)
    expect(useStore.getState().activeTableId).toBe(2)
  })

  it('setActiveTable allows setting any id', () => {
    useStore.getState().setActiveTable(999)
    expect(useStore.getState().activeTableId).toBe(999)
  })

  it('addTable adds a new table (string)', () => {
    useStore.getState().addTable('MESA 01')
    const tables = useStore.getState().tables
    expect(tables).toHaveLength(2)
    expect(tables[1].name).toBe('MESA 01')
    expect(useStore.getState().activeTableId).toBe(tables[1].id)
  })

  it('addTable adds a delivery table', () => {
    useStore.getState().addTable({ name: 'João', isDelivery: true, phone: '99999', address: 'Rua X', fee: 5 })
    const tables = useStore.getState().tables
    expect(tables).toHaveLength(2)
    expect(tables[1].isDelivery).toBe(true)
    expect(tables[1].total).toBe(5)
    expect(tables[1].items).toHaveLength(1)
    expect(tables[1].items[0].name).toBe('Taxa de Entrega')
  })

  it('addItemToActiveTable adds item to active table', () => {
    useStore.getState().addItemToActiveTable({ name: 'Açaí 500ml', price: 20, category: 'COPOS DE AÇAÍ' })
    const table = useStore.getState().tables[0]
    expect(table.items).toHaveLength(1)
    expect(table.total).toBe(20)
  })

  it('addItemToActiveTable adds item with notes', () => {
    useStore.getState().addItemToActiveTable({ name: 'Açaí 500ml', price: 20, category: 'COPOS DE AÇAÍ', notes: 'Sem leite' })
    const table = useStore.getState().tables[0]
    expect(table.items[0].notes).toBe('Sem leite')
  })

  it('addItemToActiveTable recalculates total', () => {
    useStore.getState().addItemToActiveTable({ name: 'Item 1', price: 10, category: 'CAT' })
    useStore.getState().addItemToActiveTable({ name: 'Item 2', price: 15, category: 'CAT' })
    expect(useStore.getState().tables[0].total).toBe(25)
  })

  it('addItemToActiveTable handles item without price (coerces to 0)', () => {
    useStore.getState().addItemToActiveTable({ name: 'Grátis', category: 'CAT' })
    const table = useStore.getState().tables[0]
    expect(table.items).toHaveLength(1)
    expect(table.items[0].price).toBe(0)
    expect(table.total).toBe(0)
  })

  it('removeItemFromActiveTable removes item at index', () => {
    useStore.getState().addItemToActiveTable({ name: 'Item 1', price: 10, category: 'CAT' })
    useStore.getState().addItemToActiveTable({ name: 'Item 2', price: 20, category: 'CAT' })
    useStore.getState().removeItemFromActiveTable(0)
    const table = useStore.getState().tables[0]
    expect(table.items).toHaveLength(1)
    expect(table.items[0].name).toBe('Item 2')
    expect(table.total).toBe(20)
  })

  it('removeItemFromActiveTable handles empty items silently', () => {
    useStore.getState().removeItemFromActiveTable(0)
    const table = useStore.getState().tables[0]
    expect(table.items).toHaveLength(0)
  })

  it('checkoutActiveTable removes active table and switches to next', () => {
    useStore.getState().addTable('MESA 01')
    const stateAfterAdd = useStore.getState()
    expect(stateAfterAdd.tables).toHaveLength(2)

    useStore.getState().checkoutActiveTable()
    const state = useStore.getState()
    expect(state.tables).toHaveLength(1)
    expect(state.tables[0].name).toBe('BALCÃO')
    expect(state.activeTableId).toBe(state.tables[0].id)
  })

  it('checkoutActiveTable creates default table if last is removed', () => {
    useStore.getState().checkoutActiveTable()
    const state = useStore.getState()
    expect(state.tables).toHaveLength(1)
    expect(state.tables[0].name).toBe('BALCÃO')
    expect(state.activeTableId).toBe(1)
  })

  it('checkoutActiveTable switches to next table when removing first', () => {
    useStore.getState().addTable('MESA 01')
    useStore.getState().addTable('MESA 02')
    useStore.getState().setActiveTable(useStore.getState().tables[0].id)
    useStore.getState().checkoutActiveTable()
    expect(useStore.getState().tables).toHaveLength(2)
    expect(useStore.getState().activeTableId).toBe(useStore.getState().tables[0].id)
  })
})
