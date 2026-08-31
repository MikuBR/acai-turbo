const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_CHANNELS = {
  'catalog:get-products': true,
  'catalog:add-product': true,
  'catalog:update-product': true,
  'catalog:delete-product': true,
  'catalog:get-price-history': true,
  'catalog:get-categories': true,
  'catalog:add-category': true,
  'catalog:delete-category': true,

  'orders:save': true,
  'orders:get-history': true,
  'orders:delete': true,

  'cash:register': true,
  'cash:open': true,
  'cash:close': true,
  'cash:get-current': true,
  'cash:get-history': true,
  'cash:preview-close': true,
  'reports:daily': true,
  'reports:by-period': true,

  'promotions:get': true,
  'promotions:add': true,
  'promotions:update': true,
  'promotions:delete': true,
  'promotions:get-active': true,

  'auth:login': true,
  'auth:verify-session': true,
  'auth:logout': true,
  'auth:verify-password': true,
  'auth:update-password': true,
  'auth:change-user-password': true,
  'auth:reset-admin-password': true,

  'users:get': true,
  'users:add': true,
  'users:update': true,
  'users:delete': true,
  'users:toggle-active': true,

  'audit:get-logs': true,

  'inventory:add': true,
  'inventory:update-quantity': true,
  'inventory:adjust': true,
  'inventory:get-movements': true,

  'financial:get-accounts': true,
  'financial:add-account': true,
  'financial:update-account': true,
  'financial:delete-account': true,
  'financial:add-transaction': true,
  'financial:get-summary': true,

  'clients:get': true,
  'clients:add': true,
  'clients:update': true,
  'clients:delete': true,
  'clients:get-orders': true,
  'clients:add-order': true,
  'clients:get-by-phone': true,

  'config:get-all': true,
  'config:update': true,

  'dialog:save-pdf': true,

  'ifood:test-connection': true,
  'ifood:poll': true,
  'ifood:start-preparation': true,
  'ifood:ready-to-pickup': true,
  'ifood:dispatch': true,
  'ifood:start-polling': true,
  'ifood:new-order': true,
  'ifood:order-cancelled': true,

  'auth:reset-manager-password': true,
  'auth:force-reset-admin': true,
  'logging:write': true,

  'app:shutdown': true,
};

function safeInvoke(channel, ...args) {
  if (!ALLOWED_CHANNELS[channel]) {
    console.error(`[preload] Channel '${channel}' is not in the allowlist`);
    return Promise.reject(new Error(`Channel '${channel}' is not allowed`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

const api = {
  catalog: {
    getProducts: (...args) => safeInvoke('catalog:get-products', ...args),
    addProduct: (...args) => safeInvoke('catalog:add-product', ...args),
    updateProduct: (...args) => safeInvoke('catalog:update-product', ...args),
    deleteProduct: (...args) => safeInvoke('catalog:delete-product', ...args),
    getPriceHistory: (...args) => safeInvoke('catalog:get-price-history', ...args),
    getCategories: (...args) => safeInvoke('catalog:get-categories', ...args),
    addCategory: (...args) => safeInvoke('catalog:add-category', ...args),
    deleteCategory: (...args) => safeInvoke('catalog:delete-category', ...args),
  },
  orders: {
    save: (...args) => safeInvoke('orders:save', ...args),
    getHistory: (...args) => safeInvoke('orders:get-history', ...args),
    delete: (...args) => safeInvoke('orders:delete', ...args),
  },
  cash: {
    register: (...args) => safeInvoke('cash:register', ...args),
    open: (...args) => safeInvoke('cash:open', ...args),
    close: (...args) => safeInvoke('cash:close', ...args),
    getCurrent: (...args) => safeInvoke('cash:get-current', ...args),
    getHistory: (...args) => safeInvoke('cash:get-history', ...args),
    previewClose: (...args) => safeInvoke('cash:preview-close', ...args),
  },
  reports: {
    daily: (...args) => safeInvoke('reports:daily', ...args),
    byPeriod: (...args) => safeInvoke('reports:by-period', ...args),
    exportPdf: (...args) => safeInvoke('dialog:save-pdf', ...args),
  },
  promotions: {
    get: (...args) => safeInvoke('promotions:get', ...args),
    add: (...args) => safeInvoke('promotions:add', ...args),
    update: (...args) => safeInvoke('promotions:update', ...args),
    delete: (...args) => safeInvoke('promotions:delete', ...args),
    getActive: (...args) => safeInvoke('promotions:get-active', ...args),
  },
  auth: {
    login: (...args) => safeInvoke('auth:login', ...args),
    verifySession: (...args) => safeInvoke('auth:verify-session', ...args),
    logout: (...args) => safeInvoke('auth:logout', ...args),
    verifyPassword: (...args) => safeInvoke('auth:verify-password', ...args),
    updatePassword: (...args) => safeInvoke('auth:update-password', ...args),
    changeUserPassword: (...args) => safeInvoke('auth:change-user-password', ...args),
  },
  users: {
    get: (...args) => safeInvoke('users:get', ...args),
    add: (...args) => safeInvoke('users:add', ...args),
    update: (...args) => safeInvoke('users:update', ...args),
    delete: (...args) => safeInvoke('users:delete', ...args),
    toggleActive: (...args) => safeInvoke('users:toggle-active', ...args),
  },
  audit: {
    getLogs: (...args) => safeInvoke('audit:get-logs', ...args),
  },
  inventory: {
    add: (...args) => safeInvoke('inventory:add', ...args),
    updateQuantity: (...args) => safeInvoke('inventory:update-quantity', ...args),
    adjust: (...args) => safeInvoke('inventory:adjust', ...args),
    getMovements: (...args) => safeInvoke('inventory:get-movements', ...args),
  },
  financial: {
    getAccounts: (...args) => safeInvoke('financial:get-accounts', ...args),
    addAccount: (...args) => safeInvoke('financial:add-account', ...args),
    updateAccount: (...args) => safeInvoke('financial:update-account', ...args),
    deleteAccount: (...args) => safeInvoke('financial:delete-account', ...args),
    addTransaction: (...args) => safeInvoke('financial:add-transaction', ...args),
    getSummary: (...args) => safeInvoke('financial:get-summary', ...args),
  },
  clients: {
    get: (...args) => safeInvoke('clients:get', ...args),
    add: (...args) => safeInvoke('clients:add', ...args),
    update: (...args) => safeInvoke('clients:update', ...args),
    delete: (...args) => safeInvoke('clients:delete', ...args),
    getOrders: (...args) => safeInvoke('clients:get-orders', ...args),
    addOrder: (...args) => safeInvoke('clients:add-order', ...args),
    getByPhone: (...args) => safeInvoke('clients:get-by-phone', ...args),
  },
  ifood: {
    testConnection: (...args) => safeInvoke('ifood:test-connection', ...args),
    poll: (...args) => safeInvoke('ifood:poll', ...args),
    startPreparation: (...args) => safeInvoke('ifood:start-preparation', ...args),
    readyToPickup: (...args) => safeInvoke('ifood:ready-to-pickup', ...args),
    dispatch: (...args) => safeInvoke('ifood:dispatch', ...args),
    startPolling: (...args) => safeInvoke('ifood:start-polling', ...args),
  },
  config: {
    getAll: (...args) => safeInvoke('config:get-all', ...args),
    update: (...args) => safeInvoke('config:update', ...args),
  },
  recovery: {
    resetManagerPassword: (...args) => safeInvoke('auth:reset-manager-password', ...args),
    forceResetAdmin: (...args) => safeInvoke('auth:force-reset-admin', ...args),
  },
};

contextBridge.exposeInMainWorld('api', api);

const legacyIpc = {
  invoke: (channel, ...args) => safeInvoke(channel, ...args),
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
