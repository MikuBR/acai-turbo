import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'acai_turbo_v4.db');
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
    payment_method TEXT,
    is_delivery BOOLEAN DEFAULT 0,
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
`);

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
export const getCategories = () => db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
export const addCategory = (name) => db.prepare('INSERT INTO categories (name) VALUES (?)').run(name).lastInsertRowid;
export const deleteCategory = (id) => db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;

// --- EXPORTAÇÕES DE PRODUTOS ---
export const getProducts = () => db.prepare('SELECT * FROM products ORDER BY category, name ASC').all();
export const addProduct = (p) => db.prepare('INSERT INTO products (name, price, category, ingredients) VALUES (?, ?, ?, ?)').run(p.name, p.price, p.category, p.ingredients).lastInsertRowid;
export const updateProduct = (id, p) => db.prepare('UPDATE products SET name = ?, price = ?, category = ?, ingredients = ? WHERE id = ?').run(p.name, p.price, p.category, p.ingredients, id).changes > 0;
export const deleteProduct = (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;

// --- EXPORTAÇÕES GERAIS E CAIXA ---
export const getConfig = (key) => db.prepare('SELECT value FROM config WHERE key = ?').get(key);
export const updateConfig = (key, value) => db.prepare('UPDATE config SET value = ? WHERE key = ?').run(value, key);

export function saveFullOrder(orderData, items) {
  const transaction = db.transaction((order, orderItems) => {
    const info = db.prepare('INSERT INTO orders (customer_name, total, payment_method, is_delivery) VALUES (?, ?, ?, ?)').run(order.tableName, order.total, order.paymentMethod, order.isDelivery ? 1 : 0);
    const orderId = info.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_name, price, notes, category) VALUES (?, ?, ?, ?, ?)');
    for (const item of orderItems) insertItem.run(orderId, item.name, item.price, item.notes || "", item.category || "");
    return orderId;
  });
  return transaction(orderData, items);
}

// --- NOVO: HISTÓRICO E CANCELAMENTO ---
export function getOrdersHistory() {
  const orders = db.prepare("SELECT * FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY id DESC").all();
  const getItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  return orders.map(o => ({ ...o, items: getItems.all(o.id) }));
}
export const deleteOrder = (id) => db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;

export function registerCashMovement(data) {
  return db.prepare('INSERT INTO cash_movements (type, amount, description) VALUES (?, ?, ?)').run(data.type, data.amount, data.description).lastInsertRowid;
}

export function getDailyReport() {
  const sales = db.prepare(`SELECT payment_method, is_delivery, SUM(total) as total_amount FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') GROUP BY payment_method, is_delivery`).all();
  const movements = db.prepare(`SELECT type, SUM(amount) as total_amount FROM cash_movements WHERE date(created_at, 'localtime') = date('now', 'localtime') GROUP BY type`).all();
  const topProducts = db.prepare(`SELECT product_name, COUNT(*) as qty FROM order_items JOIN orders ON order_items.order_id = orders.id WHERE date(orders.created_at, 'localtime') = date('now', 'localtime') GROUP BY product_name ORDER BY qty DESC LIMIT 5`).all();
  return { sales, movements, topProducts };
}
