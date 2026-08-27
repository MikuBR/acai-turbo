// database/migrations/006-client-addresses.cjs
// Adds support for multiple delivery addresses per client.

module.exports = {
  description: 'client_addresses table for multiple addresses per client',
  up(adapter) {
    adapter.exec(`
      CREATE TABLE IF NOT EXISTS client_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        label TEXT,
        street TEXT,
        number TEXT,
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
      )
    `);
  },
  down(adapter) {
    adapter.exec('DROP TABLE IF EXISTS client_addresses');
  },
  validate(adapter) {
    const tables = adapter.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='client_addresses'"
    );
    if (!tables.length) {
      throw new Error('client_addresses table was not created');
    }
  },
};
