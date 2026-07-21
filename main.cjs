const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {
  saveFullOrder, getProducts, addProduct, deleteProduct, registerCashMovement,
  getDailyReport, getReportByPeriod, updateProduct, getConfig, updateConfig,
  getCategories, addCategory, deleteCategory, getOrdersHistory, deleteOrder,
  getPromotions, addPromotion, updatePromotion, deletePromotion, getActivePromotions,
  getUsers, getUserById, getUserByUsername, addUser, updateUser, deleteUser, toggleUserActive,
  createSession, getSession, deleteSession, cleanupExpiredSessions,
  createAuditLog, getAuditLogs,
  getInventory, getInventoryByProductId, addInventory, updateInventoryQuantity, adjustInventory, getInventoryMovements, getLowStockItems,
  getFinancialAccounts, addFinancialAccount, updateFinancialAccount, deleteFinancialAccount, addFinancialTransaction, getFinancialTransactions, getFinancialSummary,
  getClients, addClient, updateClient, deleteClient, getClientById, getClientOrders, addClientOrder,
  db
} = require('./database/db.cjs');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

console.log('[main] Database module loaded successfully');

app.disableHardwareAcceleration();
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
app.commandLine.appendSwitch('log-level', '3');

let mainWindow = null;

function showFallbackErrorPage() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const fallbackHtml = `<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Acai Turbo</title>
        <style>
          body {
            font-family: Arial, sans-serif;
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
      devTools: true,
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

async function printTickets(orderData, items) {
  const kitchenItems = items.filter(i => !i.category.toUpperCase().includes('BEBIDA') && !i.category.toUpperCase().includes('REFRIGERANTE') && !i.category.toUpperCase().includes('CHOPP'));
  const frontItems = items.filter(i => i.category.toUpperCase().includes('BEBIDA') || i.category.toUpperCase().includes('REFRIGERANTE') || i.category.toUpperCase().includes('CHOPP'));
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  if (kitchenItems.length > 0) {
    try {
      const printerKitchen = new ThermalPrinter({ type: PrinterTypes.EPSON, interface: 'tcp://192.168.1.100', timeout: 1000, characterSet: CharacterSet.PC852_LATIN2 });
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
      }
    } catch (e) { console.log("Cozinha Offline"); }
  }

  if (frontItems.length > 0) {
    try {
      const printerFront = new ThermalPrinter({ type: PrinterTypes.EPSON, interface: 'printer:TANCA', timeout: 1000, characterSet: CharacterSet.PC852_LATIN2 });
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
      }
    } catch (e) { console.log("Balcão Offline"); }
  }
}

ipcMain.handle('get-categories', async () => { try { return { success: true, data: getCategories() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-category', async (e, name) => {
  try {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return { success: false, error: 'Invalid category name' };
    }
    return { success: true, id: addCategory(name.trim()) };
  } catch (e) {
    console.error('Error adding category:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('delete-category', async (e, id) => { try { return { success: true, count: deleteCategory(id) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('get-products', async () => { try { return { success: true, data: getProducts() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-product', async (e, p) => {
  try {
    if (!p || !p.name || !p.price || !p.category) {
      return { success: false, error: 'Invalid product data' };
    }
    return { success: true, id: addProduct(p) };
  } catch (e) {
    console.error('Error adding product:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('update-product', async (e, { id, product }) => {
  try {
    if (!id || !product || !product.name || !product.price || !product.category) {
      return { success: false, error: 'Invalid product data' };
    }
    return { success: true, count: updateProduct(id, product) };
  } catch (e) {
    console.error('Error updating product:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('delete-product', async (e, id) => { try { return { success: true, count: deleteProduct(id) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('save-order', async (e, { orderData, items }) => {
  try {
    if (!orderData || !items || !Array.isArray(items)) {
      return { success: false, error: 'Invalid order data or items' };
    }
    const id = saveFullOrder(orderData, items);
    printTickets(orderData, items);
    return { success: true, id };
  } catch (e) {
    console.error('Error saving order:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-orders', async () => { try { return { success: true, data: getOrdersHistory() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-order', async (e, id) => { try { return { success: true, count: deleteOrder(id) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('register-cash', async (e, data) => {
  try {
    if (!data || !data.type || !data.amount || !data.description) {
      return { success: false, error: 'Invalid cash movement data' };
    }
    return { success: true, id: registerCashMovement(data) };
  } catch (e) {
    console.error('Error registering cash movement:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('get-daily-report', async () => { try { return { success: true, data: getDailyReport() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-report-by-period', async (e, { startDate, endDate }) => { try { return { success: true, data: getReportByPeriod(startDate, endDate) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('verify-password', async (e, password) => {
  try {
    const stored = getConfig('manager_password');
    const isValid = bcrypt.compareSync(password, stored.value);
    return { success: true, valid: isValid };
  } catch (e) {
    console.error('Error verifying password:', e);
    return { success: false, valid: false };
  }
});
ipcMain.handle('update-password', async (e, { current, next }) => {
  try {
    const stored = getConfig('manager_password');
    const isValid = bcrypt.compareSync(current, stored.value);
    if (!isValid) {
      return { success: false, error: 'Senha atual incorreta' };
    }
    const newPasswordHash = bcrypt.hashSync(next, 10);
    updateConfig('manager_password', newPasswordHash);
    return { success: true };
  } catch (e) {
    console.error('Error updating password:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-promotions', async () => { try { return { success: true, data: getPromotions() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-promotion', async (e, promo) => {
  try {
    if (!promo || !promo.name || !promo.type || !promo.value || !promo.applies_to || !promo.start_date || !promo.end_date) {
      return { success: false, error: 'Invalid promotion data' };
    }
    return { success: true, id: addPromotion(promo) };
  } catch (e) {
    console.error('Error adding promotion:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('update-promotion', async (e, { id, promo }) => {
  try {
    if (!id || !promo || !promo.name || !promo.type || !promo.value || !promo.applies_to || !promo.start_date || !promo.end_date) {
      return { success: false, error: 'Invalid promotion data' };
    }
    return { success: true, count: updatePromotion(id, promo) };
  } catch (e) {
    console.error('Error updating promotion:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('delete-promotion', async (e, id) => { try { return { success: true, count: deletePromotion(id) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-active-promotions', async () => { try { return { success: true, data: getActivePromotions() }; } catch (e) { return { success: false, error: e.message }; } });

// --- AUTHENTICATION IPC HANDLERS ---
ipcMain.handle('login', async (e, { username, password }) => {
  try {
    const user = getUserByUsername(username);
    if (!user || !user.is_active) {
      return { success: false, error: 'Usuário não encontrado ou inativo' };
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockTime = new Date(user.locked_until);
      const minutesLeft = Math.ceil((lockTime - new Date()) / 60000);
      return { success: false, error: `Conta bloqueada. Tente novamente em ${minutesLeft} minutos.` };
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      // Increment failed login attempts
      const attempts = (user.failed_login_attempts || 0) + 1;
      const updateStmt = db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?');
      updateStmt.run(attempts, user.id);

      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
        const lockStmt = db.prepare('UPDATE users SET locked_until = ? WHERE id = ?');
        lockStmt.run(lockUntil, user.id);
        return { success: false, error: 'Conta bloqueada por muitas tentativas. Tente novamente em 15 minutos.' };
      }

      const remaining = 5 - attempts;
      return { success: false, error: `Senha incorreta. ${remaining} tentativas restantes antes do bloqueio.` };
    }

    // Reset failed attempts on successful login
    const resetStmt = db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?');
    resetStmt.run(user.id);

    // Create session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours
    createSession(user.id, token, expiresAt);

    // Log the login
    createAuditLog(user.id, 'LOGIN', null, null, 'User logged in');

    return {
      success: true,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, must_change_password: user.must_change_password },
      token
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('verify-session', async (e, token) => {
  try {
    cleanupExpiredSessions();
    const sessionData = getSession(token);
    if (!sessionData) {
      return { success: false, error: 'Sessão inválida ou expirada' };
    }
    return { success: true, user: sessionData.user };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('logout', async (e, { token, userId }) => {
  try {
    deleteSession(token);
    createAuditLog(userId, 'LOGOUT', null, null, 'User logged out');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// --- USER MANAGEMENT IPC HANDLERS ---
ipcMain.handle('get-users', async () => { try { return { success: true, data: getUsers() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-user', async (e, user) => {
  try {
    if (!user || !user.username || !user.password || !user.full_name || !user.role) {
      return { success: false, error: 'Invalid user data' };
    }
    return { success: true, id: addUser(user) };
  } catch (e) {
    console.error('Error adding user:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('update-user', async (e, { id, user }) => {
  try {
    if (!id || !user || !user.username || !user.full_name || !user.role) {
      return { success: false, error: 'Invalid user data' };
    }
    return { success: true, count: updateUser(id, user) };
  } catch (e) {
    console.error('Error updating user:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('delete-user', async (e, id) => { try { return { success: true, count: deleteUser(id) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('toggle-user-active', async (e, id) => { try { return { success: true, count: toggleUserActive(id) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('change-user-password', async (e, { userId, current, new: newPassword }) => {
  try {
    const user = getUserById(userId);
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    const isValid = bcrypt.compareSync(current, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Senha atual incorreta' };
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    const db = require('./database/db.cjs');
    const stmt = db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?');
    stmt.run(newPasswordHash, userId);

    createAuditLog(userId, 'PASSWORD_CHANGE', null, null, 'User changed password');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// --- AUDIT LOGS IPC HANDLERS ---
ipcMain.handle('get-audit-logs', async (e, limit) => { try { return { success: true, data: getAuditLogs(limit) }; } catch (e) { return { success: false, error: e.message }; } });

// --- INVENTORY IPC HANDLERS ---
ipcMain.handle('get-inventory', async () => { try { return { success: true, data: getInventory() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-inventory', async (e, { productId, quantity, unit, minQuantity }) => {
  try {
    if (!productId || !quantity || quantity < 0) {
      return { success: false, error: 'Invalid inventory data' };
    }
    return { success: true, id: addInventory(productId, quantity, unit, minQuantity) };
  } catch (e) {
    console.error('Error adding inventory:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('update-inventory-quantity', async (e, { inventoryId, newQuantity }) => {
  try {
    if (!inventoryId || newQuantity === undefined || newQuantity < 0) {
      return { success: false, error: 'Invalid inventory data' };
    }
    return { success: true, count: updateInventoryQuantity(inventoryId, newQuantity) };
  } catch (e) {
    console.error('Error updating inventory quantity:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('adjust-inventory', async (e, { inventoryId, delta, reason }) => {
  try {
    if (!inventoryId || delta === undefined || isNaN(delta)) {
      return { success: false, error: 'Invalid inventory adjustment data' };
    }
    return { success: true, success: adjustInventory(inventoryId, delta, reason) };
  } catch (e) {
    console.error('Error adjusting inventory:', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('get-inventory-movements', async (e, { inventoryId, limit }) => { try { return { success: true, data: getInventoryMovements(inventoryId, limit) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-low-stock-items', async () => { try { return { success: true, data: getLowStockItems() }; } catch (e) { return { success: false, error: e.message }; } });

// --- FINANCIAL IPC HANDLERS ---
ipcMain.handle('get-financial-accounts', async (e, { type, status }) => { try { return { success: true, data: getFinancialAccounts(type, status) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-financial-account', async (e, account) => { try { return { success: true, id: addFinancialAccount(account) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('update-financial-account', async (e, { id, account }) => { try { return { success: true, count: updateFinancialAccount(id, account) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-financial-account', async (e, id) => { try { return { success: true, count: deleteFinancialAccount(id) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-financial-transaction', async (e, transaction) => { try { return { success: true, id: addFinancialTransaction(transaction) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-financial-transactions', async (e, accountId) => { try { return { success: true, data: getFinancialTransactions(accountId) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-financial-summary', async (e, { startDate, endDate }) => { try { return { success: true, data: getFinancialSummary(startDate, endDate) }; } catch (e) { return { success: false, error: e.message }; } });

// --- CLIENTS IPC HANDLERS ---
ipcMain.handle('get-clients', async () => { try { return { success: true, data: getClients() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-client', async (e, client) => { try { return { success: true, id: addClient(client) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('update-client', async (e, { id, client }) => { try { return { success: true, count: updateClient(id, client) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-client', async (e, id) => { try { return { success: true, count: deleteClient(id) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-client-orders', async (e, clientId) => { try { return { success: true, data: getClientOrders(clientId) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-client-order', async (e, { clientId, orderId, totalAmount }) => { try { return { success: true, id: addClientOrder(clientId, orderId, totalAmount) }; } catch (e) { return { success: false, error: e.message }; } });

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