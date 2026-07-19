import { create } from 'zustand';

export const useStore = create((set) => ({
  activeTableId: 1,
  tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }],
  catalog: [],

  setCatalog: (catalog) => set({ catalog }),
  setActiveTable: (id) => set({ activeTableId: id }),
  
  addTable: (payload) => set((state) => {
    const newId = Date.now();
    let newTable = { id: newId, name: '', isDelivery: false, address: '', phone: '', items: [], total: 0 };

    if (typeof payload === 'string') {
      newTable.name = payload;
    } else {
      newTable.name = payload.name;
      newTable.isDelivery = payload.isDelivery;
      newTable.address = payload.address;
      newTable.phone = payload.phone;
      if (payload.fee > 0) {
        newTable.items.push({ name: 'Taxa de Entrega', price: payload.fee, category: 'TAXA', notes: '' });
        newTable.total = payload.fee;
      }
    }
    return { tables: [...state.tables, newTable], activeTableId: newId };
  }),

  addItemToActiveTable: (product) => set((state) => ({
    tables: state.tables.map(t => {
      if (t.id === state.activeTableId) {
        const newItems = [...t.items, product];
        const newTotal = newItems.reduce((acc, curr) => acc + curr.price, 0);
        return { ...t, items: newItems, total: newTotal };
      }
      return t;
    })
  })),

  removeItemFromActiveTable: (index) => set((state) => ({
    tables: state.tables.map(t => {
      if (t.id === state.activeTableId) {
        const newItems = t.items.filter((_, i) => i !== index);
        const newTotal = newItems.reduce((acc, curr) => acc + curr.price, 0);
        return { ...t, items: newItems, total: newTotal };
      }
      return t;
    })
  })),

  checkoutActiveTable: () => set((state) => {
    const remaining = state.tables.filter(t => t.id !== state.activeTableId);
    if (remaining.length === 0) {
      return { tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }], activeTableId: 1 };
    }
    return { tables: remaining, activeTableId: remaining[0].id };
  })
}));
