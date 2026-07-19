const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { 
  saveFullOrder, getProducts, addProduct, deleteProduct, registerCashMovement, 
  getDailyReport, updateProduct, getConfig, updateConfig, 
  getCategories, addCategory, deleteCategory, getOrdersHistory, deleteOrder,
  getPromotions, addPromotion, updatePromotion, deletePromotion, getActivePromotions
} = require('./database/db.cjs');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

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
    webPreferences: { nodeIntegration: true, contextIsolation: false, devTools: true },
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
ipcMain.handle('add-category', async (e, name) => { try { return { success: true, id: addCategory(name) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-category', async (e, id) => { try { return { success: true, count: deleteCategory(id) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('get-products', async () => { try { return { success: true, data: getProducts() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-product', async (e, p) => { try { return { success: true, id: addProduct(p) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('update-product', async (e, { id, product }) => { try { return { success: true, count: updateProduct(id, product) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-product', async (e, id) => { try { return { success: true, count: deleteProduct(id) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('save-order', async (e, { orderData, items }) => {
  try { const id = saveFullOrder(orderData, items); printTickets(orderData, items); return { success: true, id }; } 
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('get-orders', async () => { try { return { success: true, data: getOrdersHistory() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-order', async (e, id) => { try { return { success: true, count: deleteOrder(id) }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('register-cash', async (e, data) => { try { return { success: true, id: registerCashMovement(data) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-daily-report', async () => { try { return { success: true, data: getDailyReport() }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('verify-password', async (e, password) => { try { const stored = getConfig('manager_password'); return { success: true, valid: stored.value === password }; } catch (e) { return { success: false, valid: false }; } });
ipcMain.handle('update-password', async (e, { current, next }) => { try { const stored = getConfig('manager_password'); if (stored.value !== current) return { success: false, error: 'Senha atual incorreta' }; updateConfig('manager_password', next); return { success: true }; } catch (e) { return { success: false, error: e.message }; } });

ipcMain.handle('get-promotions', async () => { try { return { success: true, data: getPromotions() }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('add-promotion', async (e, promo) => { try { return { success: true, id: addPromotion(promo) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('update-promotion', async (e, { id, promo }) => { try { return { success: true, count: updatePromotion(id, promo) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('delete-promotion', async (e, id) => { try { return { success: true, count: deletePromotion(id) }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('get-active-promotions', async () => { try { return { success: true, data: getActivePromotions() }; } catch (e) { return { success: false, error: e.message }; } });

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