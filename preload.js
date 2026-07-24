const { contextBridge, ipcRenderer } = require('electron');

// ============================================================
// ALLOWLIST DE CANAIS IPC - SEGURANÇA
// Apenas canais explicitamente listados podem ser invocados
// ============================================================

const ALLOWED_CHANNELS = {
  // --- CATÁLOGO ---
  'catalog:get-products': true,
  'catalog:add-product': true,
  'catalog:update-product': true,
  'catalog:delete-product': true,
  'catalog:get-categories': true,
  'catalog:add-category': true,
  'catalog:delete-category': true,

  // --- PEDIDOS ---
  'orders:save': true,
  'orders:get-history': true,
  'orders:delete': true,

  // --- CAIXA / RELATÓRIOS ---
  'cash:register': true,
  'reports:daily': true,
  'reports:by-period': true,

  // --- PROMOÇÕES ---
  'promotions:get': true,
  'promotions:add': true,
  'promotions:update': true,
  'promotions:delete': true,
  'promotions:get-active': true,

  // --- AUTENTICAÇÃO ---
  'auth:login': true,
  'auth:verify-session': true,
  'auth:logout': true,
  'auth:verify-password': true,
  'auth:update-password': true,
  'auth:change-user-password': true,

  // --- USUÁRIOS ---
  'users:get': true,
  'users:add': true,
  'users:update': true,
  'users:delete': true,
  'users:toggle-active': true,

  // --- AUDITORIA ---
  'audit:get-logs': true,

  // --- ESTOQUE ---
  'inventory:get': true,
  'inventory:add': true,
  'inventory:update-quantity': true,
  'inventory:adjust': true,
  'inventory:get-movements': true,
  'inventory:get-low-stock': true,

  // --- FINANCEIRO ---
  'financial:get-accounts': true,
  'financial:add-account': true,
  'financial:update-account': true,
  'financial:delete-account': true,
  'financial:add-transaction': true,
  'financial:get-transactions': true,
  'financial:get-summary': true,

  // --- CLIENTES ---
  'clients:get': true,
  'clients:add': true,
  'clients:update': true,
  'clients:delete': true,
  'clients:get-orders': true,
  'clients:add-order': true,

  // --- CONFIGURAÇÕES ---
  'config:get-all': true,
  'config:update': true,

  // --- RECUPERAÇÃO ---
  'auth:reset-manager-password': true,
  'auth:force-reset-admin': true,
};

// ============================================================
// API SEGURA EXPOSTA AO RENDERER
// ============================================================

const api = {
  catalog: {
    getProducts: (...args) => ipcRenderer.invoke('catalog:get-products', ...args),
    addProduct: (...args) => ipcRenderer.invoke('catalog:add-product', ...args),
    updateProduct: (...args) => ipcRenderer.invoke('catalog:update-product', ...args),
    deleteProduct: (...args) => ipcRenderer.invoke('catalog:delete-product', ...args),
    getCategories: (...args) => ipcRenderer.invoke('catalog:get-categories', ...args),
    addCategory: (...args) => ipcRenderer.invoke('catalog:add-category', ...args),
    deleteCategory: (...args) => ipcRenderer.invoke('catalog:delete-category', ...args),
  },
  orders: {
    save: (...args) => ipcRenderer.invoke('orders:save', ...args),
    getHistory: (...args) => ipcRenderer.invoke('orders:get-history', ...args),
    delete: (...args) => ipcRenderer.invoke('orders:delete', ...args),
  },
  cash: {
    register: (...args) => ipcRenderer.invoke('cash:register', ...args),
  },
  reports: {
    daily: (...args) => ipcRenderer.invoke('reports:daily', ...args),
    byPeriod: (...args) => ipcRenderer.invoke('reports:by-period', ...args),
  },
  promotions: {
    get: (...args) => ipcRenderer.invoke('promotions:get', ...args),
    add: (...args) => ipcRenderer.invoke('promotions:add', ...args),
    update: (...args) => ipcRenderer.invoke('promotions:update', ...args),
    delete: (...args) => ipcRenderer.invoke('promotions:delete', ...args),
    getActive: (...args) => ipcRenderer.invoke('promotions:get-active', ...args),
  },
  auth: {
    login: (...args) => ipcRenderer.invoke('auth:login', ...args),
    verifySession: (...args) => ipcRenderer.invoke('auth:verify-session', ...args),
    logout: (...args) => ipcRenderer.invoke('auth:logout', ...args),
    verifyPassword: (...args) => ipcRenderer.invoke('auth:verify-password', ...args),
    updatePassword: (...args) => ipcRenderer.invoke('auth:update-password', ...args),
    changeUserPassword: (...args) => ipcRenderer.invoke('auth:change-user-password', ...args),
  },
  users: {
    get: (...args) => ipcRenderer.invoke('users:get', ...args),
    add: (...args) => ipcRenderer.invoke('users:add', ...args),
    update: (...args) => ipcRenderer.invoke('users:update', ...args),
    delete: (...args) => ipcRenderer.invoke('users:delete', ...args),
    toggleActive: (...args) => ipcRenderer.invoke('users:toggle-active', ...args),
  },
  audit: {
    getLogs: (...args) => ipcRenderer.invoke('audit:get-logs', ...args),
  },
  inventory: {
    get: (...args) => ipcRenderer.invoke('inventory:get', ...args),
    add: (...args) => ipcRenderer.invoke('inventory:add', ...args),
    updateQuantity: (...args) => ipcRenderer.invoke('inventory:update-quantity', ...args),
    adjust: (...args) => ipcRenderer.invoke('inventory:adjust', ...args),
    getMovements: (...args) => ipcRenderer.invoke('inventory:get-movements', ...args),
    getLowStock: (...args) => ipcRenderer.invoke('inventory:get-low-stock', ...args),
  },
  financial: {
    getAccounts: (...args) => ipcRenderer.invoke('financial:get-accounts', ...args),
    addAccount: (...args) => ipcRenderer.invoke('financial:add-account', ...args),
    updateAccount: (...args) => ipcRenderer.invoke('financial:update-account', ...args),
    deleteAccount: (...args) => ipcRenderer.invoke('financial:delete-account', ...args),
    addTransaction: (...args) => ipcRenderer.invoke('financial:add-transaction', ...args),
    getTransactions: (...args) => ipcRenderer.invoke('financial:get-transactions', ...args),
    getSummary: (...args) => ipcRenderer.invoke('financial:get-summary', ...args),
  },
  clients: {
    get: (...args) => ipcRenderer.invoke('clients:get', ...args),
    add: (...args) => ipcRenderer.invoke('clients:add', ...args),
    update: (...args) => ipcRenderer.invoke('clients:update', ...args),
    delete: (...args) => ipcRenderer.invoke('clients:delete', ...args),
    getOrders: (...args) => ipcRenderer.invoke('clients:get-orders', ...args),
    addOrder: (...args) => ipcRenderer.invoke('clients:add-order', ...args),
  },
  config: {
    getAll: (...args) => ipcRenderer.invoke('config:get-all', ...args),
    update: (...args) => ipcRenderer.invoke('config:update', ...args),
  },
  recovery: {
    resetManagerPassword: (...args) => ipcRenderer.invoke('auth:reset-manager-password', ...args),
    forceResetAdmin: (...args) => ipcRenderer.invoke('auth:force-reset-admin', ...args),
  },
};

// ============================================================
// EXPOR API SEGURA (sem ipcRenderer cru exposto)
// ============================================================

contextBridge.exposeInMainWorld('api', api);

// ============================================================
// COMPATIBILIDADE RETROATIVA (legado)
// Ainda expõe window.electron para código existente,
// mas com a mesma allowlist de canais
// ============================================================

const legacyIpc = {
  invoke: (channel, ...args) => {
    if (!ALLOWED_CHANNELS[channel]) {
      console.error(`[preload] Channel '${channel}' is not in the allowlist`);
      return Promise.reject(new Error(`Channel '${channel}' is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, func) => {
    if (!ALLOWED_CHANNELS[channel]) {
      console.error(`[preload] Channel '${channel}' is not in the allowlist`);
      return;
    }
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  once: (channel, func) => {
    if (!ALLOWED_CHANNELS[channel]) {
      console.error(`[preload] Channel '${channel}' is not in the allowlist`);
      return;
    }
    ipcRenderer.once(channel, (event, ...args) => func(...args));
  },
  removeListener: (channel, func) => {
    if (!ALLOWED_CHANNELS[channel]) {
      console.error(`[preload] Channel '${channel}' is not in the allowlist`);
      return;
    }
    ipcRenderer.removeListener(channel, func);
  },
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: legacyIpc,
  require: (module) => {
    if (module === 'electron') {
      return { ipcRenderer: legacyIpc };
    }
    throw new Error(`Module '${module}' is not allowed in renderer process`);
  }
});
