const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const bcrypt = require('bcryptjs');

// Função para obter o caminho do banco - sempre usa userData (diretório gravável)
// app.getPath('userData') está disponível antes do evento ready para o nome 'userData'
function getDbPath() {
  try {
    return path.join(app.getPath('userData'), 'acai_turbo_v4.db');
  } catch (e) {
    const os = require('os');
    return path.join(os.tmpdir(), 'acai-wave', 'acai_turbo_v4.db');
  }
}

const dbPath = getDbPath();
let db;

function initializeDatabase() {
  try {
    console.log('[db] Initializing database at:', dbPath);
    console.log('[db] better-sqlite3 Database constructor:', typeof Database);
    
    db = new Database(dbPath);
    console.log('[db] Database instance created:', typeof db);
    console.log('[db] Database prepare method:', typeof db.prepare);
    
    db.pragma('journal_mode = WAL');
    console.log('[db] Database initialized successfully');
  } catch (error) {
    console.error('[db] Failed to initialize database:', error.message);
    console.error('[db] Error stack:', error.stack);
    throw new Error(`Database initialization failed: ${error.message}. Please check file permissions and disk space.`);
  }
}

// Initialize database immediately for now
initializeDatabase();

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    ingredients TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    total REAL NOT NULL,
    original_total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    promotion_id INTEGER,
    promotion_name TEXT,
    payment_method TEXT,
    is_delivery BOOLEAN DEFAULT 0,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_name TEXT,
    price REAL,
    notes TEXT,
    category TEXT,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value REAL NOT NULL,
    applies_to TEXT NOT NULL,
    target_category TEXT,
    target_product_id INTEGER,
    min_quantity INTEGER DEFAULT 1,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ifood_pending_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    display_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    order_data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    must_change_password BOOLEAN DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'un',
    min_quantity REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    quantity REAL NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS financial_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending',
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS financial_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES financial_accounts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    email TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    old_price REAL NOT NULL,
    new_price REAL NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
  );
`);

// Migration: Add address and phone columns if they don't exist
try {
  db.prepare('ALTER TABLE orders ADD COLUMN address TEXT').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE orders ADD COLUMN phone TEXT').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE orders ADD COLUMN original_total REAL DEFAULT 0').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE orders ADD COLUMN promotion_id INTEGER').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE orders ADD COLUMN promotion_name TEXT').run();
} catch (e) {
  // Column already exists, ignore error
}

// Migration: Add security columns to users table
try {
  db.prepare('ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT 0').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0').run();
} catch (e) {
  // Column already exists, ignore error
}
try {
  db.prepare('ALTER TABLE users ADD COLUMN locked_until DATETIME').run();
} catch (e) {
  // Column already exists, ignore error
}

// Create indexes for better report performance
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON cash_movements(created_at)').run();
} catch (e) {
  // Index already exists, ignore error
}
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_financial_accounts_due_date ON financial_accounts(due_date)').run();
} catch (e) {
  // Index already exists, ignore error
}
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at)').run();
} catch (e) {
  // Index already exists, ignore error
}
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)').run();
} catch (e) {
  // Index already exists, ignore error
}
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON financial_transactions(account_id)').run();
} catch (e) {
  // Index already exists, ignore error
}
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_client_orders_client_id ON client_orders(client_id)').run();
} catch (e) {
  // Index already exists, ignore error
}

// --- SEED DE DADOS PADRÃO ---
// Reset login counters on startup to prevent persistent lockout after reinstall
try {
  db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE failed_login_attempts > 0 OR locked_until IS NOT NULL').run();
} catch (e) {
  // Table might not exist yet during first init, ignore
}

const seedDefaults = db.transaction(() => {
  const configCount = db.prepare('SELECT COUNT(*) as count FROM config').get();
  if (configCount.count === 0) {
    const passwordHash = bcrypt.hashSync('1234', 10);
    const insertCfg = db.prepare('INSERT INTO config (key, value) VALUES (?, ?)');
    insertCfg.run('manager_password', passwordHash);
    insertCfg.run('printer_kitchen_ip', '192.168.1.100');
    insertCfg.run('printer_front_name', 'TANCA');
    console.log('[db] Default config seeded');
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash, full_name, role, must_change_password) VALUES (?, ?, ?, ?, ?)').run('admin', passwordHash, 'Administrador', 'admin', 0);
    console.log('[db] Admin user created. Default password: admin123');
  }
});
seedDefaults();

const checkCats = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (checkCats.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  ['COPOS DE AÇAÍ', 'ADICIONAIS DOCES', 'BEBIDAS', 'PORÇÕES'].forEach(c => insertCat.run(c));
}

const checkProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (checkProducts.count === 0) {
  const insertProd = db.prepare('INSERT INTO products (name, price, category, ingredients) VALUES (?, ?, ?, ?)');
  insertProd.run('Açaí 380ml (Direito a 3 Adicionais)', 15.0, 'COPOS DE AÇAÍ', '');
  insertProd.run('Açaí 500ml (Direito a 4 Adicionais)', 20.0, 'COPOS DE AÇAÍ', '');
  insertProd.run('Açaí 700ml (Direito a 4 Adicionais)', 25.0, 'COPOS DE AÇAÍ', '');
  
  const adicionais = ['Banana', 'Morango', 'Leite em Pó', 'Leite Condensado', 'Nutella', 'Granola', 'Uva Verde s/ Semente', 'Ovomaltine', 'Paçoca', 'Kiwi', 'Confete', 'Chantilly', 'Salada de Frutas', 'Mel'];
  adicionais.forEach(add => insertProd.run(add, 0.0, 'ADICIONAIS DOCES', ''));
}

// --- EXPORTAÇÕES DE CATEGORIAS ---
const getCategories = () => db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
const addCategory = (name) => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Nome da categoria inválido');
  }
  const nameTrimmed = name.trim();
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(nameTrimmed);
  if (existing) {
    throw new Error(`Categoria "${nameTrimmed}" já existe`);
  }
  return db.prepare('INSERT INTO categories (name) VALUES (?)').run(nameTrimmed).lastInsertRowid;
};
const deleteCategory = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid category ID');
  }
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;
};

// --- EXPORTAÇÕES DE PRODUTOS ---
const getProducts = () => db.prepare('SELECT * FROM products ORDER BY category, name ASC').all();
const addProduct = (p) => {
  if (!p || !p.name || !p.category || p.price === undefined || isNaN(p.price)) {
    throw new Error('Invalid product data');
  }
  return db.prepare('INSERT INTO products (name, price, category, ingredients) VALUES (?, ?, ?, ?)').run(p.name, p.price, p.category, p.ingredients || '').lastInsertRowid;
};
const updateProduct = (id, p) => {
  if (!id || isNaN(id) || !p || !p.name || !p.category || p.price === undefined || isNaN(p.price)) {
    throw new Error('Invalid product data');
  }
  const transaction = db.transaction(() => {
    const old = db.prepare('SELECT price FROM products WHERE id = ?').get(id);
    if (old) {
      db.prepare('INSERT INTO product_price_history (product_id, old_price, new_price) VALUES (?, ?, ?)').run(id, old.price, p.price);
    }
    db.prepare('UPDATE products SET name = ?, price = ?, category = ?, ingredients = ? WHERE id = ?').run(p.name, p.price, p.category, p.ingredients || '', id);
  });
  transaction();
  return true;
};
const deleteProduct = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid product ID');
  }
  return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
};

// --- EXPORTAÇÕES GERAIS E CAIXA ---
const getConfig = (key) => db.prepare('SELECT value FROM config WHERE key = ?').get(key);
const updateConfig = (key, value) => db.prepare('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);

function saveFullOrder(orderData, items) {
  if (!orderData || !items || !Array.isArray(items)) {
    throw new Error('Invalid order data or items');
  }
  if (!orderData.tableName || orderData.total === undefined || isNaN(orderData.total)) {
    throw new Error('Invalid order data');
  }
  const transaction = db.transaction((order, orderItems) => {
    const info = db.prepare('INSERT INTO orders (customer_name, total, original_total, discount, promotion_id, promotion_name, payment_method, is_delivery, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(order.tableName, order.total, order.originalTotal || 0, order.discount || 0, order.promotionId || null, order.promotionName || null, order.paymentMethod || '', order.isDelivery ? 1 : 0, order.address || "", order.phone || "");
    const orderId = info.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_name, price, notes, category) VALUES (?, ?, ?, ?, ?)');
    for (const item of orderItems) {
      if (!item.name || item.price === undefined || isNaN(item.price)) {
        throw new Error('Invalid item data');
      }
      insertItem.run(orderId, item.name, item.price, item.notes || "", item.category || "");
    }
    return orderId;
  });
  return transaction(orderData, items);
}

// --- iFOOD: PEDIDOS PENDENTES ---
function addIfoodPendingOrder(orderId, displayId, eventId, merchantId, orderData) {
  if (!orderId || !displayId || !eventId || !merchantId || !orderData) {
    throw new Error('Invalid ifood pending order data');
  }
  db.prepare('INSERT OR IGNORE INTO ifood_pending_orders (order_id, display_id, event_id, merchant_id, order_data) VALUES (?, ?, ?, ?, ?)').run(orderId, displayId, eventId, merchantId, JSON.stringify(orderData));
  return true;
}

function getIfoodPendingOrders() {
  const rows = db.prepare('SELECT * FROM ifood_pending_orders WHERE status != ? ORDER BY created_at ASC').all('cancelled');
  return rows.map(r => ({ ...r, order_data: JSON.parse(r.order_data) }));
}

function getIfoodPendingOrderByOrderId(orderId) {
  const row = db.prepare('SELECT * FROM ifood_pending_orders WHERE order_id = ?').get(orderId);
  if (!row) return null;
  return { ...row, order_data: JSON.parse(row.order_data) };
}

function updateIfoodPendingOrderStatus(orderId, status) {
  if (!orderId || !status) throw new Error('Invalid params');
  db.prepare('UPDATE ifood_pending_orders SET status = ? WHERE order_id = ?').run(status, orderId);
}

function removeIfoodPendingOrder(orderId) {
  db.prepare('DELETE FROM ifood_pending_orders WHERE order_id = ?').run(orderId);
}

function countIfoodPendingOrders() {
  const row = db.prepare('SELECT COUNT(*) as count FROM ifood_pending_orders WHERE status = ?').get('pending');
  return row?.count || 0;
}

// --- NOVO: HISTÓRICO E CANCELAMENTO ---
function getOrdersHistory(startDate, endDate) {
  let query;
  const params = [];
  if (startDate && endDate) {
    query = "SELECT * FROM orders WHERE datetime(created_at, 'localtime') >= datetime(?, 'localtime') AND datetime(created_at, 'localtime') <= datetime(? || ' 23:59:59', 'localtime') ORDER BY id DESC";
    params.push(startDate, endDate);
  } else {
    query = "SELECT * FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY id DESC";
  }
  const orders = db.prepare(query).all(...params);
  const getItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  return orders.map(o => ({ ...o, items: getItems.all(o.id) }));
}
const deleteOrder = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid order ID');
  }
  return db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;
};

function registerCashMovement(data) {
  if (!data || !data.type || !data.description || data.amount === undefined || isNaN(data.amount)) {
    throw new Error('Invalid cash movement data');
  }
  return db.prepare('INSERT INTO cash_movements (type, amount, description) VALUES (?, ?, ?)').run(data.type, data.amount, data.description).lastInsertRowid;
}

function getDailyReport() {
  const sales = db.prepare(`SELECT payment_method, is_delivery, SUM(total) as total_amount FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') GROUP BY payment_method, is_delivery`).all();
  const movements = db.prepare(`SELECT id, type, amount as total_amount, description, created_at FROM cash_movements WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY created_at DESC`).all();
  const topProducts = db.prepare(`SELECT product_name, COUNT(*) as qty FROM order_items JOIN orders ON order_items.order_id = orders.id WHERE date(orders.created_at, 'localtime') = date('now', 'localtime') GROUP BY product_name ORDER BY qty DESC LIMIT 5`).all();
  return { sales, movements, topProducts };
}

function getReportByPeriod(startDate, endDate) {
  const endDateTime = `${endDate} 23:59:59`;
  const sales = db.prepare(`
    SELECT payment_method, is_delivery, SUM(total) as total_amount, COUNT(*) as order_count
    FROM orders
    WHERE datetime(created_at, 'localtime') >= datetime(?, 'localtime')
    AND datetime(created_at, 'localtime') <= datetime(?, 'localtime')
    GROUP BY payment_method, is_delivery
  `).all(startDate, endDateTime);

  const movements = db.prepare(`
    SELECT id, type, amount as total_amount, description, created_at
    FROM cash_movements
    WHERE datetime(created_at, 'localtime') >= datetime(?, 'localtime')
    AND datetime(created_at, 'localtime') <= datetime(?, 'localtime')
    ORDER BY created_at DESC
  `).all(startDate, endDateTime);

  const topProducts = db.prepare(`
    SELECT product_name, COUNT(*) as qty, SUM(price) as total_revenue
    FROM order_items
    JOIN orders ON order_items.order_id = orders.id
    WHERE datetime(orders.created_at, 'localtime') >= datetime(?, 'localtime')
    AND datetime(orders.created_at, 'localtime') <= datetime(?, 'localtime')
    GROUP BY product_name
    ORDER BY qty DESC
    LIMIT 10
  `).all(startDate, endDateTime);

  const peakHours = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as order_count, SUM(total) as total_amount
    FROM orders
    WHERE datetime(created_at, 'localtime') >= datetime(?, 'localtime')
    AND datetime(created_at, 'localtime') <= datetime(?, 'localtime')
    GROUP BY hour
    ORDER BY order_count DESC
  `).all(startDate, endDateTime);

  const ticketAverage = db.prepare(`
    SELECT AVG(total) as avg_ticket
    FROM orders
    WHERE datetime(created_at, 'localtime') >= datetime(?, 'localtime')
    AND datetime(created_at, 'localtime') <= datetime(?, 'localtime')
  `).get(startDate, endDateTime);

  return { sales, movements, topProducts, peakHours, ticketAverage: ticketAverage?.avg_ticket || 0 };
}

// --- EXPORTAÇÕES DE PROMOÇÕES ---
const getPromotions = () => db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
const addPromotion = (promo) => {
  if (!promo || !promo.name || !promo.type || promo.value === undefined || isNaN(promo.value) || !promo.applies_to || !promo.start_date || !promo.end_date) {
    throw new Error('Invalid promotion data');
  }
  const stmt = db.prepare(`
    INSERT INTO promotions (name, type, value, applies_to, target_category, target_product_id, min_quantity, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(promo.name, promo.type, promo.value, promo.applies_to, promo.target_category || null, promo.target_product_id || null, promo.min_quantity || 1, promo.start_date, promo.end_date, promo.is_active !== false ? 1 : 0).lastInsertRowid;
};
const updatePromotion = (id, promo) => {
  if (!id || isNaN(id) || !promo || !promo.name || !promo.type || promo.value === undefined || isNaN(promo.value) || !promo.applies_to || !promo.start_date || !promo.end_date) {
    throw new Error('Invalid promotion data');
  }
  const stmt = db.prepare(`
    UPDATE promotions SET name = ?, type = ?, value = ?, applies_to = ?, target_category = ?, target_product_id = ?, min_quantity = ?, start_date = ?, end_date = ?, is_active = ?
    WHERE id = ?
  `);
  return stmt.run(promo.name, promo.type, promo.value, promo.applies_to, promo.target_category || null, promo.target_product_id || null, promo.min_quantity || 1, promo.start_date, promo.end_date, promo.is_active !== false ? 1 : 0, id).changes > 0;
};
const deletePromotion = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid promotion ID');
  }
  return db.prepare('DELETE FROM promotions WHERE id = ?').run(id).changes > 0;
};
const getActivePromotions = () => {
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT * FROM promotions
    WHERE is_active = 1
    AND datetime(start_date) <= datetime(?)
    AND datetime(end_date) >= datetime(?)
    ORDER BY created_at DESC
  `).all(now, now);
};

// --- EXPORTAÇÕES DE USUÁRIOS ---
const getUsers = () => db.prepare('SELECT id, username, full_name, role, created_at, is_active FROM users ORDER BY created_at DESC').all();
const getUserById = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid user ID');
  }
  return db.prepare('SELECT id, username, full_name, role, created_at, is_active FROM users WHERE id = ?').get(id);
};
const getUserByUsername = (username) => {
  if (!username || typeof username !== 'string') {
    throw new Error('Invalid username');
  }
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
};
const addUser = (user) => {
  if (!user || !user.username || !user.password || !user.full_name || !user.role) {
    throw new Error('Invalid user data');
  }
  const passwordHash = bcrypt.hashSync(user.password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)');
  return stmt.run(user.username, passwordHash, user.full_name, user.role).lastInsertRowid;
};
const updateUser = (id, user) => {
  if (!id || isNaN(id) || !user || !user.username || !user.full_name || !user.role) {
    throw new Error('Invalid user data');
  }
  let stmt;
  if (user.password) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    stmt = db.prepare('UPDATE users SET username = ?, password_hash = ?, full_name = ?, role = ? WHERE id = ?');
    return stmt.run(user.username, passwordHash, user.full_name, user.role, id).changes > 0;
  } else {
    stmt = db.prepare('UPDATE users SET username = ?, full_name = ?, role = ? WHERE id = ?');
    return stmt.run(user.username, user.full_name, user.role, id).changes > 0;
  }
};
const deleteUser = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid user ID');
  }
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
  if (user && user.role === 'admin') {
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
    if (adminCount.count <= 1) {
      throw new Error('Não é possível excluir o último administrador');
    }
  }
  return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
};
const toggleUserActive = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid user ID');
  }
  const user = db.prepare('SELECT is_active, role FROM users WHERE id = ?').get(id);
  if (!user) return false;
  if (user.is_active && user.role === 'admin') {
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = ?').get('admin', 1);
    if (adminCount.count <= 1) {
      throw new Error('Não é possível desativar o último administrador ativo');
    }
  }
  return db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(user.is_active ? 0 : 1, id).changes > 0;
};

// --- EXPORTAÇÕES DE SESSÕES ---
const createSession = (userId, token, expiresAt) => {
  if (!userId || isNaN(userId) || !token || !expiresAt) {
    throw new Error('Invalid session data');
  }
  const stmt = db.prepare('INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)');
  return stmt.run(userId, token, expiresAt).lastInsertRowid;
};
const getSession = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid session token');
  }
  const session = db.prepare("SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > datetime('now')").get(token);
  if (session) {
    const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE id = ?').get(session.user_id);
    return { session, user };
  }
  return null;
};
const deleteSession = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid session token');
  }
  return db.prepare('DELETE FROM user_sessions WHERE session_token = ?').run(token).changes > 0;
};
const cleanupExpiredSessions = () => db.prepare("DELETE FROM user_sessions WHERE expires_at < datetime('now')").run();

// --- EXPORTAÇÕES DE AUDIT LOGS ---
const createAuditLog = (userId, action, entityType, entityId, details) => {
  const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)');
  return stmt.run(userId, action, entityType, entityId, details).lastInsertRowid;
};
const getAuditLogs = (limit = 100) => {
  const logs = db.prepare(`
    SELECT al.*, u.username, u.full_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);
  return logs;
};

// --- EXPORTAÇÕES DE ESTOQUE ---
const getInventory = () => {
  const inventory = db.prepare(`
    SELECT i.*, p.name as product_name, p.category
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    ORDER BY p.name ASC
  `).all();
  return inventory;
};

const getInventoryByProductId = (productId) => {
  if (!productId || isNaN(productId)) {
    throw new Error('Invalid product ID');
  }
  return db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(productId);
};

const addInventory = (productId, quantity, unit = 'un', minQuantity = 0) => {
  if (!productId || isNaN(productId) || quantity === undefined || isNaN(quantity) || quantity < 0) {
    throw new Error('Invalid inventory data');
  }
  const stmt = db.prepare('INSERT INTO inventory (product_id, quantity, unit, min_quantity) VALUES (?, ?, ?, ?)');
  return stmt.run(productId, quantity, unit || 'un', minQuantity || 0).lastInsertRowid;
};

const updateInventoryQuantity = (inventoryId, newQuantity) => {
  if (!inventoryId || isNaN(inventoryId) || newQuantity === undefined || isNaN(newQuantity) || newQuantity < 0) {
    throw new Error('Invalid inventory data');
  }
  const stmt = db.prepare('UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(newQuantity, inventoryId).changes > 0;
};

const adjustInventory = (inventoryId, delta, reason) => {
  if (!inventoryId || isNaN(inventoryId) || delta === undefined || isNaN(delta)) {
    throw new Error('Invalid inventory adjustment data');
  }
  const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(inventoryId);
  if (!inventory) return false;

  const newQuantity = Math.max(0, inventory.quantity + delta);
  const transaction = db.transaction(() => {
    db.prepare('UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(newQuantity, inventoryId);
    db.prepare('INSERT INTO inventory_movements (inventory_id, type, quantity, reason) VALUES (?, ?, ?, ?)').run(inventoryId, delta >= 0 ? 'ENTRADA' : 'SAIDA', Math.abs(delta), reason || '');
  });
  transaction();

  return true;
};

const getInventoryMovements = (inventoryId, limit = 50) => {
  if (!inventoryId || isNaN(inventoryId)) {
    throw new Error('Invalid inventory ID');
  }
  return db.prepare(`
    SELECT * FROM inventory_movements
    WHERE inventory_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(inventoryId, limit || 50);
};

const getLowStockItems = () => {
  return db.prepare(`
    SELECT i.*, p.name as product_name, p.category
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.quantity <= i.min_quantity
    ORDER BY i.quantity ASC
  `).all();
};

// --- EXPORTAÇÕES FINANCEIRAS ---
const getFinancialAccounts = (type = null, status = null, startDate = null, endDate = null) => {
  let query = 'SELECT * FROM financial_accounts WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (startDate) {
    query += ' AND date(due_date) >= date(?)';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date(due_date) <= date(?)';
    params.push(endDate);
  }

  query += ' ORDER BY due_date ASC';
  return db.prepare(query).all(...params);
};

const addFinancialAccount = (account) => {
  if (!account || !account.type || !account.description || account.amount === undefined || isNaN(account.amount)) {
    throw new Error('Invalid financial account data');
  }
  const stmt = db.prepare(`
    INSERT INTO financial_accounts (type, description, amount, due_date, status, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(account.type, account.description, account.amount, account.due_date || null, account.status || 'pending', account.category || null).lastInsertRowid;
};

const updateFinancialAccount = (id, account) => {
  if (!id || isNaN(id) || !account || !account.type || !account.description || account.amount === undefined || isNaN(account.amount)) {
    throw new Error('Invalid financial account data');
  }
  const stmt = db.prepare(`
    UPDATE financial_accounts SET type = ?, description = ?, amount = ?, due_date = ?, status = ?, category = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(account.type, account.description, account.amount, account.due_date || null, account.status, account.category || null, id).changes > 0;
};

const deleteFinancialAccount = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid financial account ID');
  }
  return db.prepare('DELETE FROM financial_accounts WHERE id = ?').run(id).changes > 0;
};

const addFinancialTransaction = (transaction) => {
  if (!transaction || !transaction.account_id || !transaction.type || transaction.amount === undefined || isNaN(transaction.amount)) {
    throw new Error('Invalid financial transaction data');
  }
  const stmt = db.prepare(`
    INSERT INTO financial_transactions (account_id, type, amount, payment_method, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(transaction.account_id, transaction.type, transaction.amount, transaction.payment_method || null, transaction.notes || null).lastInsertRowid;
};

const getFinancialTransactions = (accountId = null) => {
  if (accountId) {
    if (!accountId || isNaN(accountId)) {
      throw new Error('Invalid account ID');
    }
    return db.prepare('SELECT * FROM financial_transactions WHERE account_id = ? ORDER BY created_at DESC').all(accountId);
  }
  return db.prepare('SELECT * FROM financial_transactions ORDER BY created_at DESC').all();
};

const getFinancialSummary = (startDate = null, endDate = null) => {
  let query = `
    SELECT
      type,
      status,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
      SUM(amount) as total
    FROM financial_accounts
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    query += ' AND date(due_date) >= date(?)';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date(due_date) <= date(?)';
    params.push(endDate);
  }

  query += ' GROUP BY type, status';
  return db.prepare(query).all(...params);
};

// --- EXPORTAÇÕES DE CLIENTES ---
const getClients = () => {
  return db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
};

const addClient = (client) => {
  if (!client || !client.name) {
    throw new Error('Invalid client data');
  }
  const stmt = db.prepare(`
    INSERT INTO clients (name, phone, address, email, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(client.name, client.phone || null, client.address || null, client.email || null, client.notes || null).lastInsertRowid;
};

const updateClient = (id, client) => {
  if (!id || isNaN(id) || !client || !client.name) {
    throw new Error('Invalid client data');
  }
  const stmt = db.prepare(`
    UPDATE clients SET name = ?, phone = ?, address = ?, email = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(client.name, client.phone || null, client.address || null, client.email || null, client.notes || null, id).changes > 0;
};

const deleteClient = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid client ID');
  }
  return db.prepare('DELETE FROM clients WHERE id = ?').run(id).changes > 0;
};

const getClientById = (id) => {
  if (!id || isNaN(id)) {
    throw new Error('Invalid client ID');
  }
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
};

const getClientOrders = (clientId) => {
  if (!clientId || isNaN(clientId)) {
    throw new Error('Invalid client ID');
  }
  return db.prepare(`
    SELECT co.*, o.customer_name, o.payment_method, o.created_at
    FROM client_orders co
    JOIN orders o ON co.order_id = o.id
    WHERE co.client_id = ?
    ORDER BY co.order_date DESC
  `).all(clientId);
};

const addClientOrder = (clientId, orderId, totalAmount) => {
  if (!clientId || isNaN(clientId) || !orderId || isNaN(orderId) || totalAmount === undefined || isNaN(totalAmount)) {
    throw new Error('Invalid client order data');
  }
  const stmt = db.prepare(`
    INSERT INTO client_orders (client_id, order_id, total_amount)
    VALUES (?, ?, ?)
  `);
  return stmt.run(clientId, orderId, totalAmount).lastInsertRowid;
};

const getAllConfigs = () => db.prepare('SELECT key, value FROM config WHERE key != ? ORDER BY key ASC').all('manager_password');

const getProductPriceHistory = (productId) => {
  if (!productId || isNaN(productId)) throw new Error('Invalid product ID');
  return db.prepare('SELECT * FROM product_price_history WHERE product_id = ? ORDER BY changed_at DESC LIMIT 20').all(productId);
};

module.exports = {
  db,
  getCategories, addCategory, deleteCategory,
  getProducts, addProduct, updateProduct, deleteProduct,
  getConfig, updateConfig, getAllConfigs, getProductPriceHistory,
  saveFullOrder,
  getOrdersHistory, deleteOrder,
  registerCashMovement,
  getDailyReport, getReportByPeriod,
  getPromotions, addPromotion, updatePromotion, deletePromotion, getActivePromotions,
  getUsers, getUserById, getUserByUsername, addUser, updateUser, deleteUser, toggleUserActive,
  createSession, getSession, deleteSession, cleanupExpiredSessions,
  createAuditLog, getAuditLogs,
  getInventory, getInventoryByProductId, addInventory, updateInventoryQuantity, adjustInventory, getInventoryMovements, getLowStockItems,
  getFinancialAccounts, addFinancialAccount, updateFinancialAccount, deleteFinancialAccount, addFinancialTransaction, getFinancialTransactions, getFinancialSummary,
  getClients, addClient, updateClient, deleteClient, getClientById, getClientOrders, addClientOrder,
  addIfoodPendingOrder, getIfoodPendingOrders, getIfoodPendingOrderByOrderId,
  updateIfoodPendingOrderStatus, removeIfoodPendingOrder, countIfoodPendingOrders
};