const SCHEMA_SQL = `
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

  CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON cash_movements(created_at);
  CREATE INDEX IF NOT EXISTS idx_financial_accounts_due_date ON financial_accounts(due_date);
  CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON financial_transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_client_orders_client_id ON client_orders(client_id);
`;

const expectedTables = {
  categories: ['id', 'name'],
  products: ['id', 'name', 'price', 'category', 'ingredients'],
  orders: ['id', 'customer_name', 'total', 'original_total', 'discount', 'promotion_id', 'promotion_name', 'payment_method', 'is_delivery', 'address', 'phone', 'created_at'],
  order_items: ['id', 'order_id', 'product_name', 'price', 'notes', 'category'],
  cash_movements: ['id', 'type', 'amount', 'description', 'created_at'],
  config: ['key', 'value'],
  promotions: ['id', 'name', 'type', 'value', 'applies_to', 'target_category', 'target_product_id', 'min_quantity', 'start_date', 'end_date', 'is_active', 'created_at'],
  ifood_pending_orders: ['id', 'order_id', 'display_id', 'event_id', 'merchant_id', 'order_data', 'status', 'created_at'],
  users: ['id', 'username', 'password_hash', 'full_name', 'role', 'created_at', 'is_active', 'must_change_password', 'failed_login_attempts', 'locked_until'],
  user_sessions: ['id', 'user_id', 'session_token', 'created_at', 'expires_at'],
  audit_logs: ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'details', 'created_at'],
  inventory: ['id', 'product_id', 'quantity', 'unit', 'min_quantity', 'last_updated'],
  inventory_movements: ['id', 'inventory_id', 'type', 'quantity', 'reason', 'created_at'],
  financial_accounts: ['id', 'type', 'description', 'amount', 'due_date', 'status', 'category', 'created_at', 'updated_at'],
  financial_transactions: ['id', 'account_id', 'type', 'amount', 'payment_method', 'notes', 'created_at'],
  clients: ['id', 'name', 'phone', 'address', 'email', 'notes', 'created_at', 'updated_at'],
  client_orders: ['id', 'client_id', 'order_id', 'order_date', 'total_amount'],
  product_price_history: ['id', 'product_id', 'old_price', 'new_price', 'changed_at'],
};

module.exports = {
  version: 1,
  description: 'Schema inicial do Açaí Wave — 18 tabelas + 6 índices',

  up(adapter) {
    adapter.exec(SCHEMA_SQL);
  },

  validate(adapter) {
    const tables = adapter.getTableList();
    const missing = Object.keys(expectedTables).filter(t => !tables.includes(t));
    if (missing.length > 0) {
      throw new Error(`Tabelas ausentes: ${missing.join(', ')}`);
    }
    for (const [table, expectedCols] of Object.entries(expectedTables)) {
      const columns = adapter.getTableColumns(table).map(c => c.name);
      const missingCols = expectedCols.filter(c => !columns.includes(c));
      if (missingCols.length > 0) {
        throw new Error(`Tabela ${table} com colunas ausentes: ${missingCols.join(', ')}`);
      }
    }
  },
};
