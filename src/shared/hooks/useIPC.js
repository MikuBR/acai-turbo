/**
 * Hook useIPC - Acesso tipado à API segura exposta pelo preload.
 * 
 * Uso:
 *   import { useIPC } from '../shared/hooks/useIPC';
 *   const { catalog, orders, auth } = useIPC();
 *   const products = await catalog.getProducts();
 */

export function useIPC() {
  // Prioridade: nova API segura (window.api) > legado (window.electron)
  const api = window.api || null;
  const legacy = window.electron?.ipcRenderer || null;

  if (!api && !legacy) {
    console.warn('[useIPC] Nenhuma API IPC encontrada. Rodando fora do Electron?');
  }

  return {
    catalog: api?.catalog || {
      getProducts: (...args) => legacy?.invoke('catalog:get-products', ...args),
      addProduct: (...args) => legacy?.invoke('catalog:add-product', ...args),
      updateProduct: (...args) => legacy?.invoke('catalog:update-product', ...args),
      deleteProduct: (...args) => legacy?.invoke('catalog:delete-product', ...args),
      getCategories: (...args) => legacy?.invoke('catalog:get-categories', ...args),
      addCategory: (...args) => legacy?.invoke('catalog:add-category', ...args),
      deleteCategory: (...args) => legacy?.invoke('catalog:delete-category', ...args),
    },
    orders: api?.orders || {
      save: (...args) => legacy?.invoke('orders:save', ...args),
      getHistory: (...args) => legacy?.invoke('orders:get-history', ...args),
      delete: (...args) => legacy?.invoke('orders:delete', ...args),
    },
    cash: api?.cash || {
      register: (...args) => legacy?.invoke('cash:register', ...args),
    },
    reports: api?.reports || {
      daily: (...args) => legacy?.invoke('reports:daily', ...args),
      byPeriod: (...args) => legacy?.invoke('reports:by-period', ...args),
    },
    promotions: api?.promotions || {
      get: (...args) => legacy?.invoke('promotions:get', ...args),
      add: (...args) => legacy?.invoke('promotions:add', ...args),
      update: (...args) => legacy?.invoke('promotions:update', ...args),
      delete: (...args) => legacy?.invoke('promotions:delete', ...args),
      getActive: (...args) => legacy?.invoke('promotions:get-active', ...args),
    },
    auth: api?.auth || {
      login: (...args) => legacy?.invoke('auth:login', ...args),
      verifySession: (...args) => legacy?.invoke('auth:verify-session', ...args),
      logout: (...args) => legacy?.invoke('auth:logout', ...args),
      verifyPassword: (...args) => legacy?.invoke('auth:verify-password', ...args),
      updatePassword: (...args) => legacy?.invoke('auth:update-password', ...args),
      changeUserPassword: (...args) => legacy?.invoke('auth:change-user-password', ...args),
    },
    users: api?.users || {
      get: (...args) => legacy?.invoke('users:get', ...args),
      add: (...args) => legacy?.invoke('users:add', ...args),
      update: (...args) => legacy?.invoke('users:update', ...args),
      delete: (...args) => legacy?.invoke('users:delete', ...args),
      toggleActive: (...args) => legacy?.invoke('users:toggle-active', ...args),
    },
    audit: api?.audit || {
      getLogs: (...args) => legacy?.invoke('audit:get-logs', ...args),
    },
    inventory: api?.inventory || {
      get: (...args) => legacy?.invoke('inventory:get', ...args),
      add: (...args) => legacy?.invoke('inventory:add', ...args),
      updateQuantity: (...args) => legacy?.invoke('inventory:update-quantity', ...args),
      adjust: (...args) => legacy?.invoke('inventory:adjust', ...args),
      getMovements: (...args) => legacy?.invoke('inventory:get-movements', ...args),
      getLowStock: (...args) => legacy?.invoke('inventory:get-low-stock', ...args),
    },
    financial: api?.financial || {
      getAccounts: (...args) => legacy?.invoke('financial:get-accounts', ...args),
      addAccount: (...args) => legacy?.invoke('financial:add-account', ...args),
      updateAccount: (...args) => legacy?.invoke('financial:update-account', ...args),
      deleteAccount: (...args) => legacy?.invoke('financial:delete-account', ...args),
      addTransaction: (...args) => legacy?.invoke('financial:add-transaction', ...args),
      getTransactions: (...args) => legacy?.invoke('financial:get-transactions', ...args),
      getSummary: (...args) => legacy?.invoke('financial:get-summary', ...args),
    },
    clients: api?.clients || {
      get: (...args) => legacy?.invoke('clients:get', ...args),
      add: (...args) => legacy?.invoke('clients:add', ...args),
      update: (...args) => legacy?.invoke('clients:update', ...args),
      delete: (...args) => legacy?.invoke('clients:delete', ...args),
      getOrders: (...args) => legacy?.invoke('clients:get-orders', ...args),
      addOrder: (...args) => legacy?.invoke('clients:add-order', ...args),
    },
  };
}