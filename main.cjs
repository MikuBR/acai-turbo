const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {
  saveFullOrder, getProducts, addProduct, deleteProduct, registerCashMovement,
  getDailyReport, getReportByPeriod, updateProduct, getConfig, updateConfig, getAllConfigs,
  getCategories, addCategory, deleteCategory, getOrdersHistory, deleteOrder,
  getPromotions, addPromotion, updatePromotion, deletePromotion, getActivePromotions,
  getUsers, getUserById, getUserByUsername, addUser, updateUser, deleteUser, toggleUserActive,
  createSession, getSession, deleteSession, cleanupExpiredSessions,
  createAuditLog, getAuditLogs,
  getInventory, getInventoryByProductId, addInventory, updateInventoryQuantity, adjustInventory, getInventoryMovements, getLowStockItems,
  getFinancialAccounts, addFinancialAccount, updateFinancialAccount, deleteFinancialAccount, addFinancialTransaction, getFinancialTransactions, getFinancialSummary,
  getClients, addClient, updateClient, deleteClient, getClientById, getClientOrders, addClientOrder,
  getProductPriceHistory,
  db
} = require('./database/db.cjs');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { validateIPC } = require('./database/validate.cjs');

console.log('[main] Database module loaded successfully');

// ============================================================
// SEGURANÇA: Sessão ativa e controle de acesso
// ============================================================
let currentSession = null;

function setSession(user, token) {
  currentSession = { user, token };
}

function clearSession() {
  currentSession = null;
}

function requireRole(minRole) {
  if (!currentSession) throw new Error('Não autenticado');
  if (minRole === 'admin' && currentSession.user.role !== 'admin') throw new Error('Acesso negado');
  if (minRole === 'manager' && !['admin', 'manager'].includes(currentSession.user.role)) throw new Error('Acesso negado');
}

// ============================================================
// SEGURANÇA: Rate limiter para verify-password
// ============================================================
const verifyPasswordAttempts = { count: 0, lockUntil: 0 };

function checkVerifyPasswordRateLimit() {
  if (Date.now() < verifyPasswordAttempts.lockUntil) {
    const secondsLeft = Math.ceil((verifyPasswordAttempts.lockUntil - Date.now()) / 1000);
    throw new Error(`Muitas tentativas. Tente novamente em ${secondsLeft} segundos.`);
  }
}

function recordVerifyPasswordAttempt() {
  verifyPasswordAttempts.count++;
  if (verifyPasswordAttempts.count >= 5) {
    verifyPasswordAttempts.lockUntil = Date.now() + 15 * 60 * 1000;
    verifyPasswordAttempts.count = 0;
  }
}

function resetVerifyPasswordRateLimit() {
  verifyPasswordAttempts.count = 0;
  verifyPasswordAttempts.lockUntil = 0;
}

// ============================================================
// UTILITÁRIO: Handler padronizado com validação + erro mascarado
// ============================================================
function createHandler(channel, handler, options = {}) {
  return ipcMain.handle(channel, async (event, data) => {
    try {
      const valid = validateIPC(channel, data);
      if (!valid.success) {
        return { success: false, error: valid.error };
      }
      if (options.minRole) {
        requireRole(options.minRole);
      }
      return { success: true, ...await handler(valid.data) };
    } catch (e) {
      console.error(`[${channel}] Error:`, e.message);
      const message = e.message || 'Erro interno. Tente novamente.';
      return { success: false, error: message };
    }
  });
}

// Desabilitar aceleração de hardware apenas no Linux (drivers de GPU instáveis)
// No Windows, manter habilitado para melhor performance
// Sobrescrever com env: ENABLE_GPU=true ou DISABLE_GPU=true
if (process.env.DISABLE_GPU === 'true' || (process.platform === 'linux' && process.env.ENABLE_GPU !== 'true')) {
  app.disableHardwareAcceleration();
}
// Segurança: desabilitar avisos apenas em desenvolvimento
if (!app.isPackaged) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}
app.commandLine.appendSwitch('log-level', '3');

// ============================================================
// PREVENÇÃO DE PROCESSOS FANTASMAS NO WINDOWS
// Captura exceções não tratadas e finaliza o app corretamente
// para não deixar processos filho (GPU, utility) órfãos.
// ============================================================
process.on('uncaughtException', (error) => {
  console.error('[main] UNCAUGHT EXCEPTION:', error);
  dialog.showErrorBox('Erro Fatal', `Ocorreu um erro inesperado:\n\n${error.message}\n\nO aplicativo será encerrado.`);
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[main] UNHANDLED REJECTION:', reason);
});

let mainWindow = null;

function showFallbackErrorPage() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const fallbackHtml = `<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Açaí Wave</title>
        <style>
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif;
            background: #020617;
            color: #f8fafc;
            display: grid;
            place-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            text-align: center;
          }
          .card {
            max-width: 480px;
            padding: 24px;
            border: 1px solid #334155;
            border-radius: 12px;
            background: #0f172a;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Frontend indisponível</h1>
          <p>Não foi possível carregar a interface do aplicativo.</p>
          <p>Verifique se o servidor Vite está em execução ou se o arquivo distribuído foi gerado corretamente.</p>
        </div>
      </body>
    </html>`;

  mainWindow.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHtml)}`);
}

async function loadFrontend() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (app.isPackaged) {
    try {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      await mainWindow.loadFile(indexPath);
    } catch (error) {
      console.error('[main] Falha ao carregar o frontend empacotado:', error);
      showFallbackErrorPage();
    }
    return;
  }

  const candidates = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  for (const url of candidates) {
    try {
      await mainWindow.loadURL(url);
      return;
    } catch (error) {
      console.warn(`[main] Falha ao carregar ${url}:`, error);
    }
  }

  showFallbackErrorPage();
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#020617',
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      devTools: !app.isPackaged,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[main] Falha ao carregar ${validatedURL || 'a URL'} (${errorCode}): ${errorDescription}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  loadFrontend().catch((error) => {
    console.error('[main] Erro ao carregar o frontend:', error);
  });
}

function getPrinterConfig() {
  const kitchenIp = getConfig('printer_kitchen_ip');
  const frontName = getConfig('printer_front_name');
  const frontIp = getConfig('printer_front_ip');
  return {
    kitchenIp: kitchenIp ? kitchenIp.value : '192.168.1.100',
    frontName: frontName ? frontName.value : 'TANCA',
    frontIp: frontIp ? frontIp.value : '',
  };
}

function resolvePrinterInterface(name, ip) {
  if (ip) return `tcp://${ip}`;
  return `printer:${name}`;
}

async function printTickets(orderData, items) {
  const result = { kitchen: { success: false, reason: 'Nenhum item para cozinha' }, front: { success: false, reason: 'Nenhum item para balcão' } };
  const kitchenItems = items.filter(i => !i.category.toUpperCase().includes('BEBIDA') && !i.category.toUpperCase().includes('REFRIGERANTE') && !i.category.toUpperCase().includes('CHOPP'));
  const frontItems = items.filter(i => i.category.toUpperCase().includes('BEBIDA') || i.category.toUpperCase().includes('REFRIGERANTE') || i.category.toUpperCase().includes('CHOPP'));
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  const { kitchenIp, frontName, frontIp } = getPrinterConfig();

  if (kitchenItems.length > 0) {
    try {
      const printerKitchen = new ThermalPrinter({ type: PrinterTypes.EPSON, interface: `tcp://${kitchenIp}`, timeout: 5000, characterSet: CharacterSet.PC852_LATIN2 });
      if (await printerKitchen.isPrinterConnected()) {
        printerKitchen.alignCenter(); 
        printerKitchen.setTextDoubleHeight(); 
        printerKitchen.println("COZINHA / PREPARO"); 
        printerKitchen.setTextNormal(); 
        printerKitchen.drawLine(); 
        printerKitchen.alignLeft();
        
        if (orderData.isDelivery) {
          printerKitchen.println("** DELIVERY **");
          printerKitchen.println(`Cliente: ${orderData.tableName.toUpperCase()}`);
          if (orderData.phone) printerKitchen.println(`Tel: ${orderData.phone}`);
          if (orderData.address) printerKitchen.println(`End: ${orderData.address}`);
        } else {
          printerKitchen.println(orderData.tableName.toUpperCase());
        }
        
        printerKitchen.println(`Data: ${dateStr}`); 
        printerKitchen.drawLine();
        
        kitchenItems.forEach(item => {
          printerKitchen.println(item.name.toUpperCase());
          if (item.notes) item.notes.split('|').map(n => n.trim()).forEach(note => printerKitchen.println(`*${note}`));
          printerKitchen.println("");
        });
        printerKitchen.cut(); await printerKitchen.execute();
        result.kitchen = { success: true };
      } else {
        result.kitchen = { success: false, reason: 'Impressora da cozinha não conectada' };
      }
    } catch (e) { 
      console.error("[print] Cozinha erro:", e.message);
      result.kitchen = { success: false, reason: e.message };
    }
  }

  if (frontItems.length > 0) {
    try {
      const frontInterface = resolvePrinterInterface(frontName, frontIp);
      const printerFront = new ThermalPrinter({ type: PrinterTypes.EPSON, interface: frontInterface, timeout: 5000, characterSet: CharacterSet.PC852_LATIN2 });
      if (await printerFront.isPrinterConnected()) {
        printerFront.alignLeft(); 
        printerFront.setTextDoubleHeight(); 
        printerFront.println("BEBIDAS"); 
        printerFront.setTextNormal(); 
        printerFront.drawLine();
        
        if (orderData.isDelivery) {
          printerFront.println("** DELIVERY **");
          printerFront.println(`Cliente: ${orderData.tableName.toUpperCase()}`);
          if (orderData.phone) printerFront.println(`Tel: ${orderData.phone}`);
        } else {
          printerFront.println(orderData.tableName.toUpperCase());
        }

        printerFront.println(`Data: ${dateStr}`); 
        printerFront.drawLine();
        
        frontItems.forEach(item => {
          printerFront.println(item.name.toUpperCase());
          if (item.notes) printerFront.println(`*${item.notes}`);
        });
        printerFront.openCashDrawer(); printerFront.cut(); await printerFront.execute();
        result.front = { success: true };
      } else {
        result.front = { success: false, reason: 'Impressora do balcão não conectada' };
      }
    } catch (e) { 
      console.error("[print] Balcão erro:", e.message);
      result.front = { success: false, reason: e.message };
    }
  }
  return result;
}

// ============================================================
// CATÁLOGO - IPC Handlers
// ============================================================
createHandler('catalog:get-categories', async () => ({ data: getCategories() }));
createHandler('catalog:add-category', async (name) => ({ id: addCategory(name) }));
createHandler('catalog:delete-category', async (id) => ({ count: deleteCategory(id) }));

createHandler('catalog:get-products', async () => ({ data: getProducts() }));
createHandler('catalog:add-product', async (p) => ({ id: addProduct(p) }));
createHandler('catalog:update-product', async (data) => ({ count: updateProduct(data.id, data.product) }));
createHandler('catalog:delete-product', async (id) => ({ count: deleteProduct(id) }));
createHandler('catalog:get-price-history', async (productId) => ({ data: getProductPriceHistory(productId) }));

// ============================================================
// PEDIDOS - IPC Handlers
// ============================================================
createHandler('orders:save', async (data) => {
  const id = saveFullOrder(data.orderData, data.items);
  const printResult = await printTickets(data.orderData, data.items).catch(e => ({ kitchen: { success: false, reason: e.message }, front: { success: false, reason: e.message } }));
  return { id, print: printResult };
});

createHandler('orders:get-history', async (params) => ({ data: getOrdersHistory(params?.startDate, params?.endDate) }));
createHandler('orders:delete', async (id) => ({ count: deleteOrder(id) }));

// ============================================================
// CAIXA / RELATÓRIOS - IPC Handlers
// ============================================================
createHandler('cash:register', async (data) => ({ id: registerCashMovement(data) }));
createHandler('reports:daily', async () => ({ data: getDailyReport() }));
createHandler('reports:by-period', async ({ startDate, endDate }) => ({ data: getReportByPeriod(startDate, endDate) }));

// ============================================================
// AUTENTICAÇÃO - IPC Handlers
// ============================================================
ipcMain.handle('auth:verify-password', async (e, password) => {
  try {
    checkVerifyPasswordRateLimit();
    if (!password || typeof password !== 'string') {
      return { success: false, valid: false, error: 'Senha inválida' };
    }
    const stored = getConfig('manager_password');
    const isValid = stored && bcrypt.compareSync(password, stored.value);
    if (isValid) {
      resetVerifyPasswordRateLimit();
      return { success: true, valid: true };
    }
    recordVerifyPasswordAttempt();
    return { success: true, valid: false };
  } catch (e) {
    return { success: false, valid: false, error: e.message };
  }
});

ipcMain.handle('auth:update-password', async (e, { current, next }) => {
  try {
    const stored = getConfig('manager_password');
    const isValid = bcrypt.compareSync(current, stored.value);
    if (!isValid) {
      return { success: false, error: 'Senha atual incorreta' };
    }
    const newPasswordHash = bcrypt.hashSync(next, 10);
    updateConfig('manager_password', newPasswordHash);
    createAuditLog(currentSession?.user?.id, 'MANAGER_PASSWORD_CHANGE', null, null, 'Manager password changed');
    return { success: true };
  } catch (e) {
    console.error('[auth:update-password] Error:', e.message);
    return { success: false, error: 'Erro ao atualizar senha. Tente novamente.' };
  }
});

// ============================================================
// PROMOÇÕES - IPC Handlers
// ============================================================
createHandler('promotions:get', async () => ({ data: getPromotions() }));
createHandler('promotions:add', async (promo) => ({ id: addPromotion(promo) }));
createHandler('promotions:update', async (data) => ({ count: updatePromotion(data.id, data.promo) }));
createHandler('promotions:delete', async (id) => ({ count: deletePromotion(id) }));
createHandler('promotions:get-active', async () => ({ data: getActivePromotions() }));

ipcMain.handle('auth:login', async (e, data) => {
  try {
    const valid = validateIPC('auth:login', data);
    if (!valid.success) return { success: false, error: valid.error };

    const { username, password } = valid.data;
    const user = getUserByUsername(username);
    if (!user || !user.is_active) {
      return { success: false, error: 'Usuário não encontrado ou inativo' };
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockTime = new Date(user.locked_until);
      const minutesLeft = Math.ceil((lockTime - new Date()) / 60000);
      return { success: false, error: `Conta bloqueada. Tente novamente em ${minutesLeft} minutos.` };
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);

      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET locked_until = ? WHERE id = ?').run(lockUntil, user.id);
        return { success: false, error: 'Conta bloqueada por muitas tentativas. Tente novamente em 15 minutos.' };
      }

      const remaining = 5 - attempts;
      return { success: false, error: `Senha incorreta. ${remaining} tentativas restantes antes do bloqueio.` };
    }

    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    createSession(user.id, token, expiresAt);
    createAuditLog(user.id, 'LOGIN', null, null, 'User logged in');

    setSession(
      { id: user.id, username: user.username, full_name: user.full_name, role: user.role, must_change_password: user.must_change_password },
      token
    );

    return {
      success: true,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, must_change_password: user.must_change_password },
      token
    };
  } catch (e) {
    console.error('[auth:login] Error:', e.message);
    return { success: false, error: 'Erro interno ao fazer login.' };
  }
});

ipcMain.handle('auth:verify-session', async (e, token) => {
  try {
    cleanupExpiredSessions();
    const sessionData = getSession(token);
    if (!sessionData) {
      return { success: false, error: 'Sessão inválida ou expirada' };
    }
    setSession(sessionData.user, token);
    return { success: true, user: sessionData.user };
  } catch (e) {
    console.error('[auth:verify-session] Error:', e.message);
    return { success: false, error: 'Erro ao verificar sessão.' };
  }
});

ipcMain.handle('auth:logout', async (e, { token, userId }) => {
  try {
    deleteSession(token);
    createAuditLog(userId, 'LOGOUT', null, null, 'User logged out');
    clearSession();
    return { success: true };
  } catch (e) {
    console.error('[auth:logout] Error:', e.message);
    return { success: false, error: 'Erro ao fazer logout.' };
  }
});

// ============================================================
// USUÁRIOS - IPC Handlers (admin only)
// ============================================================
createHandler('users:get', async () => ({ data: getUsers() }));
createHandler('users:add', async (user) => ({ id: addUser(user) }), { minRole: 'admin' });
createHandler('users:update', async (data) => ({ count: updateUser(data.id, data.user) }), { minRole: 'admin' });
createHandler('users:delete', async (id) => ({ count: deleteUser(id) }), { minRole: 'admin' });
createHandler('users:toggle-active', async (id) => ({ count: toggleUserActive(id) }), { minRole: 'admin' });
createHandler('auth:change-user-password', async ({ userId, current, new: newPassword }) => {
  const user = getUserById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const isValid = bcrypt.compareSync(current, user.password_hash);
  if (!isValid) {
    throw new Error('Senha atual incorreta');
  }

  const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(newPasswordHash, userId);

  createAuditLog(userId, 'PASSWORD_CHANGE', null, null, 'User changed password');

  return { success: true };
});

// ============================================================
// AUDITORIA - IPC Handlers
// ============================================================
createHandler('audit:get-logs', async (limit) => ({ data: getAuditLogs(limit) }), { minRole: 'manager' });

// ============================================================
// ESTOQUE - IPC Handlers
// ============================================================
createHandler('inventory:get', async () => ({ data: getInventory() }));
createHandler('inventory:add', async (data) => ({ id: addInventory(data.productId, data.quantity, data.unit, data.minQuantity) }));
createHandler('inventory:update-quantity', async ({ inventoryId, newQuantity }) => ({ count: updateInventoryQuantity(inventoryId, newQuantity) }));
createHandler('inventory:adjust', async (data) => ({ data: adjustInventory(data.inventoryId, data.delta, data.reason) }));
createHandler('inventory:get-movements', async ({ inventoryId, limit }) => ({ data: getInventoryMovements(inventoryId, limit) }));
createHandler('inventory:get-low-stock', async () => ({ data: getLowStockItems() }));

// ============================================================
// FINANCEIRO - IPC Handlers
// ============================================================
createHandler('financial:get-accounts', async ({ type, status, startDate, endDate }) => ({ data: getFinancialAccounts(type, status, startDate, endDate) }));
createHandler('financial:add-account', async (account) => ({ id: addFinancialAccount(account) }));
createHandler('financial:update-account', async (data) => ({ count: updateFinancialAccount(data.id, data.account) }));
createHandler('financial:delete-account', async (id) => ({ count: deleteFinancialAccount(id) }));
createHandler('financial:add-transaction', async (transaction) => ({ id: addFinancialTransaction(transaction) }));
createHandler('financial:get-transactions', async (accountId) => ({ data: getFinancialTransactions(accountId) }));
createHandler('financial:get-summary', async ({ startDate, endDate }) => ({ data: getFinancialSummary(startDate, endDate) }));

// ============================================================
// CLIENTES - IPC Handlers
// ============================================================
createHandler('clients:get', async () => ({ data: getClients() }));
createHandler('clients:add', async (client) => ({ id: addClient(client) }));
createHandler('clients:update', async (data) => ({ count: updateClient(data.id, data.client) }));
createHandler('clients:delete', async (id) => ({ count: deleteClient(id) }));
createHandler('clients:get-orders', async (clientId) => ({ data: getClientOrders(clientId) }));
createHandler('clients:add-order', async ({ clientId, orderId, totalAmount }) => ({ id: addClientOrder(clientId, orderId, totalAmount) }));

// ============================================================
// RECUPERAÇÃO DE SENHAS (redundância)
// ============================================================
const resetPasswordAttempts = {};

function checkResetRateLimit(userId) {
  const now = Date.now();
  const entry = resetPasswordAttempts[userId];
  if (entry && entry.count >= 3 && now < entry.resetAt) {
    const secondsLeft = Math.ceil((entry.resetAt - now) / 1000);
    throw new Error(`Muitas tentativas de reset. Tente novamente em ${secondsLeft} segundos.`);
  }
  if (!entry || now >= entry.resetAt) {
    resetPasswordAttempts[userId] = { count: 0, resetAt: now + 3600000 };
  }
}

function recordResetAttempt(userId) {
  if (resetPasswordAttempts[userId]) {
    resetPasswordAttempts[userId].count++;
  }
}

ipcMain.handle('auth:reset-manager-password', async (e, data) => {
  try {
    requireRole('admin');
    const admin = currentSession ? currentSession.user : null;
    checkResetRateLimit(admin?.id);

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = bcrypt.hashSync(tempPassword, 10);
    updateConfig('manager_password', hash);
    createAuditLog(admin?.id, 'MANAGER_PASSWORD_RESET', 'config', 'manager_password', 'Manager password reset by admin');

    recordResetAttempt(admin?.id);
    return { success: true, tempPassword };
  } catch (e) {
    console.error('[auth:reset-manager-password] Error:', e.message);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('auth:force-reset-admin', async (e, { adminId, newPassword }) => {
  try {
    requireRole('admin');
    const admin = currentSession ? currentSession.user : null;
    if (!admin) {
      return { success: false, error: 'Sessão inválida' };
    }
    checkResetRateLimit(admin.id);

    const target = getUserById(adminId);
    if (!target || target.role !== 'admin') {
      return { success: false, error: 'Administrador não encontrado' };
    }
    if (target.id === admin.id) {
      return { success: false, error: 'Use a opção de trocar sua própria senha' };
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return { success: false, error: 'A nova senha deve ter no mínimo 8 caracteres' };
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(newHash, adminId);
    createAuditLog(admin.id, 'ADMIN_PASSWORD_RESET', 'users', adminId, `Admin password reset by ${admin.username}`);
    recordResetAttempt(admin.id);
    return { success: true };
  } catch (e) {
    console.error('[auth:force-reset-admin] Error:', e.message);
    return { success: false, error: e.message };
  }
});

// ============================================================
// CONFIGURAÇÕES - IPC Handlers (printer, etc.)
// ============================================================
createHandler('config:get-all', async () => ({ data: getAllConfigs() }));
createHandler('config:update', async ({ key, value }) => {
  updateConfig(key, value);
  return { success: true };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });