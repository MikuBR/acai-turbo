import { create } from 'zustand';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  ingredients?: string;
  notes?: string;
}

interface Table {
  id: number;
  name: string;
  isDelivery: boolean;
  address: string;
  phone: string;
  items: MenuItem[];
  total: number;
  ifoodOrderId?: string | null;
}

interface StoreState {
  activeTableId: number;
  tables: Table[];
  catalog: MenuItem[];
  setCatalog: (catalog: MenuItem[]) => void;
  setActiveTable: (id: number) => void;
  addTable: (payload: string | { name: string; isDelivery: boolean; address: string; phone: string; fee: number }) => void;
  addItemToActiveTable: (product: MenuItem) => void;
  removeItemFromActiveTable: (index: number) => void;
  checkoutActiveTable: () => void;
  deleteTable: (id: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  activeTableId: 1,
  tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }],
  catalog: [],

  setCatalog: (catalog: MenuItem[]) => set({ catalog: catalog || [] }),
  setActiveTable: (id: number) => set({ activeTableId: id }),
  
  addTable: (payload: string | { name: string; isDelivery: boolean; address: string; phone: string; fee: number }) => set((state: StoreState) => {
    const newId = Date.now();
    let newTable: Table = { id: newId, name: '', isDelivery: false, address: '', phone: '', items: [], total: 0, ifoodOrderId: null };

    if (typeof payload === 'string') {
      newTable.name = payload;
    } else {
      newTable = { ...newTable, ...payload, items: [], total: 0 };
      if (payload.fee > 0) {
        newTable.items.push({ id: Date.now(), name: 'Taxa de Entrega', price: payload.fee, category: 'TAXA', notes: '' });
        newTable.total = payload.fee;
      }
    }
    return { tables: [...state.tables, newTable], activeTableId: newId };
  }),

  addItemToActiveTable: (product: MenuItem) => set((state: StoreState) => ({
    tables: state.tables.map((t: Table) => {
      if (t.id === state.activeTableId) {
        const safeProduct: MenuItem = {
          ...product,
          price: Number(product.price) || 0,
        } as MenuItem;
        const newItems = [...t.items, safeProduct];
        const newTotal = newItems.reduce((acc: number, curr: MenuItem) => acc + (Number(curr.price) || 0), 0);
        return { ...t, items: newItems, total: newTotal };
      }
      return t;
    })
  })),

  removeItemFromActiveTable: (index: number) => set((state: StoreState) => ({
    tables: state.tables.map((t: Table) => {
      if (t.id === state.activeTableId) {
        const newItems = t.items.filter((_: MenuItem, i: number) => i !== index);
        const newTotal = newItems.reduce((acc: number, curr: MenuItem) => acc + (Number(curr.price) || 0), 0);
        return { ...t, items: newItems, total: newTotal };
      }
      return t;
    })
  })),

  checkoutActiveTable: () => set((state: StoreState) => {
    const remaining = state.tables.filter((t: Table) => t.id !== state.activeTableId);
    if (remaining.length === 0) {
      return { tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }], activeTableId: 1 };
    }
    return { tables: remaining, activeTableId: remaining[0].id };
  }),

  deleteTable: (id: number) => set((state: StoreState) => {
    const remaining = state.tables.filter((t: Table) => t.id !== id);
    if (state.activeTableId !== id) {
      return { tables: remaining };
    }
    if (remaining.length === 0) {
      return { tables: [{ id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }], activeTableId: 1 };
    }
    return { tables: remaining, activeTableId: remaining[0].id };
  })
}));
