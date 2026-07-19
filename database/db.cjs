const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Função para obter o caminho do banco - funciona tanto em dev quanto em produção
function getDbPath() {
  // Se o app já está pronto, usa userData; senão usa diretório local
  try {
    if (app && app.isReady()) {
      return path.join(app.getPath('userData'), 'acai_turbo_v4.db');
    }
  } catch (e) {
    // app não está pronto, usa diretório local
  }
  // Em desenvolvimento, usa o diretório do projeto
  return path.join(__dirname, 'acai_turbo_v4.db');
}

const dbPath = getDbPath();
const db = new Database(dbPath);

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

// --- SEED DE DADOS PADRÃO ---
const checkConfig = db.prepare('SELECT COUNT(*) as count FROM config').get();
if (checkConfig.count === 0) {
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('manager_password', '1234');
}

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
const addCategory = (name) => db.prepare('INSERT INTO categories (name) VALUES (?)').run(name).lastInsertRowid;
const deleteCategory = (id) => db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;

// --- EXPORTAÇÕES DE PRODUTOS ---
const getProducts = () => db.prepare('SELECT * FROM products ORDER BY category, name ASC').all();
const addProduct = (p) => db.prepare('INSERT INTO products (name, price, category, ingredients) VALUES (?, ?, ?, ?)').run(p.name, p.price, p.category, p.ingredients).lastInsertRowid;
const updateProduct = (id, p) => db.prepare('UPDATE products SET name = ?, price = ?, category = ?, ingredients = ? WHERE id = ?').run(p.name, p.price, p.category, p.ingredients, id).changes > 0;
const deleteProduct = (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;

// --- EXPORTAÇÕES GERAIS E CAIXA ---
const getConfig = (key) => db.prepare('SELECT value FROM config WHERE key = ?').get(key);
const updateConfig = (key, value) => db.prepare('UPDATE config SET value = ? WHERE key = ?').run(value, key);

function saveFullOrder(orderData, items) {
  const transaction = db.transaction((order, orderItems) => {
    const info = db.prepare('INSERT INTO orders (customer_name, total, payment_method, is_delivery, address, phone) VALUES (?, ?, ?, ?, ?, ?)').run(order.tableName, order.total, order.paymentMethod, order.isDelivery ? 1 : 0, order.address || "", order.phone || "");
    const orderId = info.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_name, price, notes, category) VALUES (?, ?, ?, ?, ?)');
    for (const item of orderItems) insertItem.run(orderId, item.name, item.price, item.notes || "", item.category || "");
    return orderId;
  });
  return transaction(orderData, items);
}

// --- NOVO: HISTÓRICO E CANCELAMENTO ---
function getOrdersHistory() {
  const orders = db.prepare("SELECT * FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY id DESC").all();
  const getItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  return orders.map(o => ({ ...o, items: getItems.all(o.id) }));
}
const deleteOrder = (id) => db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;

function registerCashMovement(data) {
  return db.prepare('INSERT INTO cash_movements (type, amount, description) VALUES (?, ?, ?)').run(data.type, data.amount, data.description).lastInsertRowid;
}

function getDailyReport() {
  const sales = db.prepare(`SELECT payment_method, is_delivery, SUM(total) as total_amount FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') GROUP BY payment_method, is_delivery`).all();
  const movements = db.prepare(`SELECT type, SUM(amount) as total_amount FROM cash_movements WHERE date(created_at, 'localtime') = date('now', 'localtime') GROUP BY type`).all();
  const topProducts = db.prepare(`SELECT product_name, COUNT(*) as qty FROM order_items JOIN orders ON order_items.order_id = orders.id WHERE date(orders.created_at, 'localtime') = date('now', 'localtime') GROUP BY product_name ORDER BY qty DESC LIMIT 5`).all();
  return { sales, movements, topProducts };
}

// --- EXPORTAÇÕES DE PROMOÇÕES ---
const getPromotions = () => db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
const addPromotion = (promo) => {
  const stmt = db.prepare(`
    INSERT INTO promotions (name, type, value, applies_to, target_category, target_product_id, min_quantity, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(promo.name, promo.type, promo.value, promo.applies_to, promo.target_category || null, promo.target_product_id || null, promo.min_quantity || 1, promo.start_date, promo.end_date, promo.is_active !== false ? 1 : 0).lastInsertRowid;
};
const updatePromotion = (id, promo) => {
  const stmt = db.prepare(`
    UPDATE promotions SET name = ?, type = ?, value = ?, applies_to = ?, target_category = ?, target_product_id = ?, min_quantity = ?, start_date = ?, end_date = ?, is_active = ?
    WHERE id = ?
  `);
  return stmt.run(promo.name, promo.type, promo.value, promo.applies_to, promo.target_category || null, promo.target_product_id || null, promo.min_quantity || 1, promo.start_date, promo.end_date, promo.is_active !== false ? 1 : 0, id).changes > 0;
};
const deletePromotion = (id) => db.prepare('DELETE FROM promotions WHERE id = ?').run(id).changes > 0;
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

module.exports = {
  getCategories, addCategory, deleteCategory,
  getProducts, addProduct, updateProduct, deleteProduct,
  getConfig, updateConfig,
  saveFullOrder,
  getOrdersHistory, deleteOrder,
  registerCashMovement,
  getDailyReport,
  getPromotions, addPromotion, updatePromotion, deletePromotion, getActivePromotions
};