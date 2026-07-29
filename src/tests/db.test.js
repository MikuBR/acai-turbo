import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const SCHEMA = `
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
`

function seedCategory (name) {
  return d.prepare('INSERT INTO categories (name) VALUES (?)').run(name).lastInsertRowid
}

function seedProduct (name, price, category) {
  return d.prepare('INSERT INTO products (name, price, category, ingredients) VALUES (?, ?, ?, ?)').run(name, price, category, '').lastInsertRowid
}

function seedUser (username, password, fullName, role) {
  const hash = bcrypt.hashSync(password, 4)
  return d.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)').run(username, hash, fullName, role).lastInsertRowid
}

function seedOrder (total, paymentMethod) {
  return d.prepare('INSERT INTO orders (customer_name, total, payment_method) VALUES (?, ?, ?)').run('Cliente Teste', total, paymentMethod).lastInsertRowid
}

function seedCashMovement (type, amount, description) {
  return d.prepare('INSERT INTO cash_movements (type, amount, description) VALUES (?, ?, ?)').run(type, amount, description).lastInsertRowid
}

const d = new Database(':memory:')
d.pragma('journal_mode = WAL')
d.pragma('foreign_keys = ON')
d.exec(SCHEMA)

afterAll(() => {
  d.close()
})

// ─── Categories ───────────────────────────────────────────────────────────────

describe('categories', () => {
  it('adds a category', () => {
    const id = seedCategory('BEBIDAS')
    expect(id).toBeGreaterThan(0)
  })

  it('retrieves all categories', () => {
    const cats = d.prepare('SELECT * FROM categories ORDER BY name ASC').all()
    expect(cats.length).toBeGreaterThanOrEqual(1)
    expect(cats.some(c => c.name === 'BEBIDAS')).toBe(true)
  })

  it('rejects duplicate name (UNIQUE constraint)', () => {
    expect(() => seedCategory('BEBIDAS')).toThrow()
  })

  it('deletes a category', () => {
    const id = seedCategory('DELETE_ME')
    const result = d.prepare('DELETE FROM categories WHERE id = ?').run(id)
    expect(result.changes).toBe(1)
    const check = d.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    expect(check).toBeUndefined()
  })
})

// ─── Products ─────────────────────────────────────────────────────────────────

describe('products', () => {
  it('adds a product', () => {
    seedCategory('LANCHES')
    const id = seedProduct('X-Tudo', 25, 'LANCHES')
    expect(id).toBeGreaterThan(0)
  })

  it('retrieves all products ordered by category,name', () => {
    const prods = d.prepare('SELECT * FROM products ORDER BY category, name ASC').all()
    expect(prods.length).toBeGreaterThanOrEqual(1)
    expect(prods[0].name).toBeDefined()
    expect(prods[0].price).toBeGreaterThan(0)
  })

  it('updates a product', () => {
    const id = seedProduct('Antigo', 10, 'LANCHES')
    d.prepare('UPDATE products SET name = ?, price = ? WHERE id = ?').run('Novo', 15, id)
    const updated = d.prepare('SELECT * FROM products WHERE id = ?').get(id)
    expect(updated.name).toBe('Novo')
    expect(updated.price).toBe(15)
  })

  it('deletes a product', () => {
    const id = seedProduct('Temp', 5, 'LANCHES')
    const result = d.prepare('DELETE FROM products WHERE id = ?').run(id)
    expect(result.changes).toBe(1)
  })
})

// ─── Orders ───────────────────────────────────────────────────────────────────

describe('orders', () => {
  it('saves an order with items', () => {
    const orderId = seedOrder(50, 'DINHEIRO')
    d.prepare('INSERT INTO order_items (order_id, product_name, price, category) VALUES (?, ?, ?, ?)').run(orderId, 'Açaí 500ml', 20, 'COPOS DE AÇAÍ')
    d.prepare('INSERT INTO order_items (order_id, product_name, price, category) VALUES (?, ?, ?, ?)').run(orderId, 'Banana', 0, 'ADICIONAIS DOCES')
    const items = d.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)
    expect(items).toHaveLength(2)
    expect(items[0].product_name).toBe('Açaí 500ml')
  })

  it('retrieves order history (today)', () => {
    const orders = d.prepare("SELECT * FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY id DESC").all()
    expect(orders.length).toBeGreaterThanOrEqual(1)
  })

  it('deletes an order and cascades to items', () => {
    const orderId = seedOrder(30, 'CRÉDITO')
    d.prepare('INSERT INTO order_items (order_id, product_name, price) VALUES (?, ?, ?)').run(orderId, 'Item', 30)
    d.prepare('DELETE FROM orders WHERE id = ?').run(orderId)
    const items = d.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)
    expect(items).toHaveLength(0)
  })
})

// ─── Daily Report ─────────────────────────────────────────────────────────────

describe('daily report', () => {
  it('aggregates sales by payment method', () => {
    seedOrder(100, 'DINHEIRO')
    seedOrder(50, 'CRÉDITO')
    seedOrder(30, 'DINHEIRO')
    const sales = d.prepare("SELECT payment_method, SUM(total) as total_amount FROM orders WHERE date(created_at, 'localtime') = date('now', 'localtime') GROUP BY payment_method").all()
    const dinheiro = sales.find(s => s.payment_method === 'DINHEIRO')
    expect(dinheiro.total_amount).toBeGreaterThanOrEqual(130)
  })

  it('includes cash movements', () => {
    seedCashMovement('ENTRADA', 200, 'Venda extra')
    seedCashMovement('SAIDA', 50, 'Troco')
    const movements = d.prepare("SELECT type, amount as total_amount, description FROM cash_movements WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY created_at DESC").all()
    expect(movements.length).toBeGreaterThanOrEqual(2)
    expect(movements.some(m => m.type === 'ENTRADA')).toBe(true)
    expect(movements.some(m => m.type === 'SAIDA')).toBe(true)
    expect(movements[0].description).toBeDefined()
  })

  it('returns top products', () => {
    const top = d.prepare("SELECT product_name, COUNT(*) as qty FROM order_items JOIN orders ON order_items.order_id = orders.id WHERE date(orders.created_at, 'localtime') = date('now', 'localtime') GROUP BY product_name ORDER BY qty DESC LIMIT 5").all()
    expect(Array.isArray(top)).toBe(true)
  })
})

// ─── Period Report ────────────────────────────────────────────────────────────

describe('period report', () => {
  it('returns sales and movements for a date range', () => {
    const today = new Date().toISOString().split('T')[0]
    const sales = d.prepare(`
      SELECT payment_method, SUM(total) as total_amount
      FROM orders
      WHERE datetime(created_at, 'localtime') >= datetime(?)
      AND datetime(created_at, 'localtime') <= datetime(?)
      GROUP BY payment_method
    `).all(today, today)
    expect(Array.isArray(sales)).toBe(true)

    const movements = d.prepare(`
      SELECT id, type, amount as total_amount, description, created_at
      FROM cash_movements
      WHERE datetime(created_at, 'localtime') >= datetime(?)
      AND datetime(created_at, 'localtime') <= datetime(?)
      ORDER BY created_at DESC
    `).all(today, today)
    expect(Array.isArray(movements)).toBe(true)
  })

  it('calculates ticket average', () => {
    const today = new Date().toISOString().split('T')[0]
    const todayCount = d.prepare('SELECT COUNT(*) as cnt FROM orders WHERE date(created_at) = date(?)').get(today)
    expect(todayCount.cnt).toBeGreaterThan(0)
    const avg = d.prepare(`
      SELECT AVG(total) as avg_ticket
      FROM orders
      WHERE date(created_at) = date(?)
    `).get(today)
    expect(Number(avg.avg_ticket)).toBeGreaterThan(0)
  })

  it('returns peak hours', () => {
    const today = new Date().toISOString().split('T')[0]
    const peaks = d.prepare(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as order_count
      FROM orders
      WHERE datetime(created_at, 'localtime') >= datetime(?)
      AND datetime(created_at, 'localtime') <= datetime(?)
      GROUP BY hour ORDER BY order_count DESC
    `).all(today, today)
    expect(Array.isArray(peaks)).toBe(true)
  })
})

// ─── Users ────────────────────────────────────────────────────────────────────

describe('users', () => {
  const UID = seedUser('operator1', 'pass123', 'Operador Um', 'operator')

  it('adds a user with hashed password', () => {
    expect(UID).toBeGreaterThan(0)
  })

  it('finds user by username', () => {
    const user = d.prepare('SELECT * FROM users WHERE username = ?').get('operator1')
    expect(user).toBeDefined()
    expect(user.full_name).toBe('Operador Um')
    expect(user.role).toBe('operator')
    expect(user.password_hash).not.toBe('pass123')
    expect(bcrypt.compareSync('pass123', user.password_hash)).toBe(true)
  })

  it('returns safe columns (no password hash)', () => {
    const users = d.prepare('SELECT id, username, full_name, role, is_active FROM users ORDER BY created_at DESC').all()
    expect(users.length).toBeGreaterThanOrEqual(1)
    expect(users[0].password_hash).toBeUndefined()
  })

  it('updates user fields', () => {
    d.prepare('UPDATE users SET full_name = ? WHERE id = ?').run('Operador Updated', UID)
    const user = d.prepare('SELECT * FROM users WHERE id = ?').get(UID)
    expect(user.full_name).toBe('Operador Updated')
  })

  it('toggles user active state', () => {
    const u = d.prepare('SELECT is_active FROM users WHERE id = ?').get(UID)
    d.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(u.is_active ? 0 : 1, UID)
    const updated = d.prepare('SELECT is_active FROM users WHERE id = ?').get(UID)
    expect(updated.is_active).toBe(u.is_active ? 0 : 1)
  })

  it('deletes a user', () => {
    const id = seedUser('delete_me', 'x', 'Del', 'operator')
    d.prepare('DELETE FROM users WHERE id = ?').run(id)
    const check = d.prepare('SELECT * FROM users WHERE id = ?').get(id)
    expect(check).toBeUndefined()
  })

  it('admin user can be created and counted', () => {
    const existing = d.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin')
    if (existing.count === 0) {
      seedUser('main_admin', 'admin123', 'Main Admin', 'admin')
    }
    const count = d.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin')
    expect(count.count).toBeGreaterThanOrEqual(1)
  })
})

// ─── Sessions ─────────────────────────────────────────────────────────────────

describe('sessions', () => {
  let userId
  beforeAll(() => {
    userId = seedUser('session_user', 'test', 'Session Test', 'operator')
  })

  it('creates a session with expiry', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    d.prepare('INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)').run(userId, 'token-abc-123', future)
    const session = d.prepare("SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > datetime('now')").get('token-abc-123')
    expect(session).toBeDefined()
    expect(session.user_id).toBe(userId)
  })

  it('returns null for expired session', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    d.prepare('INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)').run(userId, 'token-expired', past)
    const session = d.prepare("SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > datetime('now')").get('token-expired')
    expect(session).toBeUndefined()
  })

  it('deletes a session', () => {
    d.prepare('DELETE FROM user_sessions WHERE session_token = ?').run('token-abc-123')
    const check = d.prepare("SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > datetime('now')").get('token-abc-123')
    expect(check).toBeUndefined()
  })

  it('cleans up expired sessions', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    d.prepare('INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)').run(userId, 'cleanup-test', past)
    const deleted = d.prepare("DELETE FROM user_sessions WHERE expires_at < datetime('now')").run()
    expect(deleted.changes).toBeGreaterThanOrEqual(1)
  })
})

// ─── Audit Logs ───────────────────────────────────────────────────────────────

describe('audit logs', () => {
  let userId
  beforeAll(() => {
    userId = seedUser('audit_user', 'x', 'Audit Test', 'operator')
  })

  it('creates an audit log', () => {
    const id = d.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(userId, 'LOGIN', 'user', userId, 'Login realizado').lastInsertRowid
    expect(id).toBeGreaterThan(0)
  })

  it('retrieves audit logs with user info', () => {
    const logs = d.prepare(`
      SELECT al.*, u.username, u.full_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all()
    expect(logs.length).toBeGreaterThanOrEqual(1)
    expect(logs[0].username).toBeDefined()
  })

  it('creates log without user_id (SET NULL)', () => {
    const id = d.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(null, 'SYSTEM', 'config', null, 'Ação do sistema').lastInsertRowid
    expect(id).toBeGreaterThan(0)
  })
})

// ─── Inventory ────────────────────────────────────────────────────────────────

describe('inventory', () => {
  let prodId
  beforeAll(() => {
    prodId = seedProduct('Açúcar', 8, 'LANCHES')
  })

  it('adds inventory record', () => {
    d.prepare('INSERT INTO inventory (product_id, quantity, unit, min_quantity) VALUES (?, ?, ?, ?)').run(prodId, 50, 'kg', 5)
    const inv = d.prepare('SELECT * FROM inventory WHERE product_id = ?').get(prodId)
    expect(inv.quantity).toBe(50)
    expect(inv.unit).toBe('kg')
  })

  it('retrieves inventory joined with product', () => {
    const list = d.prepare(`
      SELECT i.*, p.name as product_name, p.category
      FROM inventory i JOIN products p ON i.product_id = p.id
      ORDER BY p.name ASC
    `).all()
    expect(list.length).toBeGreaterThanOrEqual(1)
    expect(list[0].product_name).toBeDefined()
  })

  it('updates quantity', () => {
    const inv = d.prepare('SELECT * FROM inventory WHERE product_id = ?').get(prodId)
    d.prepare('UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(30, inv.id)
    const updated = d.prepare('SELECT * FROM inventory WHERE id = ?').get(inv.id)
    expect(updated.quantity).toBe(30)
  })

  it('adjusts inventory and records movement', () => {
    const inv = d.prepare('SELECT * FROM inventory WHERE product_id = ?').get(prodId)
    const newQty = Math.max(0, inv.quantity + 10)
    d.prepare('UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, inv.id)
    d.prepare('INSERT INTO inventory_movements (inventory_id, type, quantity, reason) VALUES (?, ?, ?, ?)').run(inv.id, 'ENTRADA', 10, 'Reposição')
    const movements = d.prepare('SELECT * FROM inventory_movements WHERE inventory_id = ? ORDER BY created_at DESC').all(inv.id)
    expect(movements.length).toBeGreaterThanOrEqual(1)
    expect(movements[0].type).toBe('ENTRADA')
  })

  it('detects low stock items', () => {
    const items = d.prepare(`
      SELECT i.*, p.name as product_name
      FROM inventory i JOIN products p ON i.product_id = p.id
      WHERE i.quantity <= i.min_quantity
      ORDER BY i.quantity ASC
    `).all()
    expect(Array.isArray(items)).toBe(true)
  })
})

// ─── Financial ────────────────────────────────────────────────────────────────

describe('financial accounts', () => {
  let accountId

  it('adds a payable account', () => {
    accountId = d.prepare('INSERT INTO financial_accounts (type, description, amount, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?)').run('payable', 'Aluguel', 1500, '2026-08-01', 'pending', 'fixo').lastInsertRowid
    expect(accountId).toBeGreaterThan(0)
  })

  it('adds a receivable account', () => {
    const id = d.prepare('INSERT INTO financial_accounts (type, description, amount, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?)').run('receivable', 'Cliente X', 500, '2026-07-30', 'pending', 'serviços').lastInsertRowid
    expect(id).toBeGreaterThan(0)
  })

  it('filters accounts by type', () => {
    const payables = d.prepare("SELECT * FROM financial_accounts WHERE type = ? ORDER BY due_date ASC").all('payable')
    expect(payables.length).toBeGreaterThanOrEqual(1)
    expect(payables.every(a => a.type === 'payable')).toBe(true)
  })

  it('updates an account', () => {
    d.prepare("UPDATE financial_accounts SET amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(1600, 'paid', accountId)
    const updated = d.prepare('SELECT * FROM financial_accounts WHERE id = ?').get(accountId)
    expect(updated.amount).toBe(1600)
    expect(updated.status).toBe('paid')
  })

  it('deletes an account', () => {
    const tempId = d.prepare('INSERT INTO financial_accounts (type, description, amount) VALUES (?, ?, ?)').run('payable', 'Temp', 100).lastInsertRowid
    d.prepare('DELETE FROM financial_accounts WHERE id = ?').run(tempId)
    const check = d.prepare('SELECT * FROM financial_accounts WHERE id = ?').get(tempId)
    expect(check).toBeUndefined()
  })
})

describe('financial transactions', () => {
  let accountId
  beforeAll(() => {
    accountId = d.prepare('INSERT INTO financial_accounts (type, description, amount) VALUES (?, ?, ?)').run('payable', 'Conta Luz', 300).lastInsertRowid
  })

  it('adds a transaction', () => {
    const id = d.prepare('INSERT INTO financial_transactions (account_id, type, amount, payment_method, notes) VALUES (?, ?, ?, ?, ?)').run(accountId, 'payment', 300, 'PIX', 'Pagamento mensal').lastInsertRowid
    expect(id).toBeGreaterThan(0)
  })

  it('retrieves transactions by account', () => {
    const txs = d.prepare('SELECT * FROM financial_transactions WHERE account_id = ? ORDER BY created_at DESC').all(accountId)
    expect(txs.length).toBeGreaterThanOrEqual(1)
    expect(txs[0].type).toBe('payment')
  })

  it('retrieves all transactions', () => {
    const txs = d.prepare('SELECT * FROM financial_transactions ORDER BY created_at DESC').all()
    expect(txs.length).toBeGreaterThanOrEqual(1)
  })
})

describe('financial summary', () => {
  it('groups amounts by type and status', () => {
    const summary = d.prepare(`
      SELECT type, status,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
        SUM(amount) as total
      FROM financial_accounts
      GROUP BY type, status
    `).all()
    expect(summary.length).toBeGreaterThanOrEqual(1)
    expect(summary[0].total).toBeGreaterThan(0)
  })
})

// ─── Clients ──────────────────────────────────────────────────────────────────

describe('clients', () => {
  let clientId

  it('adds a client', () => {
    clientId = d.prepare('INSERT INTO clients (name, phone, address, email, notes) VALUES (?, ?, ?, ?, ?)').run('João Silva', '11999999999', 'Rua A, 123', 'joao@email.com', 'Cliente VIP').lastInsertRowid
    expect(clientId).toBeGreaterThan(0)
  })

  it('retrieves all clients ordered by name', () => {
    const clients = d.prepare('SELECT * FROM clients ORDER BY name ASC').all()
    expect(clients.length).toBeGreaterThanOrEqual(1)
    expect(clients[0].name).toBeDefined()
  })

  it('gets client by id', () => {
    const client = d.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    expect(client.name).toBe('João Silva')
    expect(client.phone).toBe('11999999999')
  })

  it('updates a client', () => {
    d.prepare("UPDATE clients SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run('João Souza', '11988888888', clientId)
    const updated = d.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    expect(updated.name).toBe('João Souza')
  })

  it('deletes a client', () => {
    const tempId = d.prepare('INSERT INTO clients (name) VALUES (?)').run('Temp').lastInsertRowid
    d.prepare('DELETE FROM clients WHERE id = ?').run(tempId)
    const check = d.prepare('SELECT * FROM clients WHERE id = ?').get(tempId)
    expect(check).toBeUndefined()
  })

  it('registers a client order', () => {
    const orderId = seedOrder(80, 'DINHEIRO')
    d.prepare('INSERT INTO client_orders (client_id, order_id, total_amount) VALUES (?, ?, ?)').run(clientId, orderId, 80)
    const orders = d.prepare(`
      SELECT co.*, o.customer_name, o.payment_method
      FROM client_orders co
      JOIN orders o ON co.order_id = o.id
      WHERE co.client_id = ?
      ORDER BY co.order_date DESC
    `).all(clientId)
    expect(orders.length).toBeGreaterThanOrEqual(1)
    expect(orders[0].payment_method).toBe('DINHEIRO')
  })
})

// ─── Promotions ───────────────────────────────────────────────────────────────

describe('promotions', () => {
  let promoId

  it('adds a promotion', () => {
    const id = d.prepare(`
      INSERT INTO promotions (name, type, value, applies_to, target_category, min_quantity, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('10% OFF', 'PERCENTAGE', 10, 'category', 'COPOS DE AÇAÍ', 1, '2026-01-01', '2026-12-31', 1).lastInsertRowid
    promoId = id
    expect(id).toBeGreaterThan(0)
  })

  it('retrieves all promotions ordered by creation', () => {
    const promos = d.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all()
    expect(promos.length).toBeGreaterThanOrEqual(1)
    expect(promos[0].name).toBe('10% OFF')
  })

  it('updates a promotion', () => {
    d.prepare("UPDATE promotions SET value = ?, is_active = ? WHERE id = ?").run(15, 0, promoId)
    const updated = d.prepare('SELECT * FROM promotions WHERE id = ?').get(promoId)
    expect(updated.value).toBe(15)
    expect(updated.is_active).toBe(0)
  })

  it('filters active promotions by date', () => {
    const now = new Date().toISOString()
    const active = d.prepare(`
      SELECT * FROM promotions
      WHERE is_active = 1
      AND datetime(start_date) <= datetime(?)
      AND datetime(end_date) >= datetime(?)
      ORDER BY created_at DESC
    `).all(now, now)
    expect(Array.isArray(active)).toBe(true)
  })

  it('deletes a promotion', () => {
    const tempId = d.prepare("INSERT INTO promotions (name, type, value, applies_to, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)").run('Temp', 'FIXED_AMOUNT', 5, 'all', '2026-01-01', '2026-12-31').lastInsertRowid
    d.prepare('DELETE FROM promotions WHERE id = ?').run(tempId)
    const check = d.prepare('SELECT * FROM promotions WHERE id = ?').get(tempId)
    expect(check).toBeUndefined()
  })
})

// ─── Config ───────────────────────────────────────────────────────────────────

describe('config', () => {
  it('sets and gets a config value', () => {
    d.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('test_key', 'test_value')
    const cfg = d.prepare("SELECT value FROM config WHERE key = ?").get('test_key')
    expect(cfg.value).toBe('test_value')
  })

  it('updates existing config', () => {
    d.prepare('UPDATE config SET value = ? WHERE key = ?').run('updated_value', 'test_key')
    const cfg = d.prepare("SELECT value FROM config WHERE key = ?").get('test_key')
    expect(cfg.value).toBe('updated_value')
  })

  it('retrieves all configs ordered by key', () => {
    const all = d.prepare('SELECT key, value FROM config ORDER BY key ASC').all()
    expect(all.length).toBeGreaterThanOrEqual(1)
    expect(all[0].key).toBeDefined()
  })
})
