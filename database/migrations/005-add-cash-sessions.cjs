/**
 * Migration 005: Adicionar tabela de sessões de caixa (abertura/fechamento)
 *
 * Adiciona:
 *   - Tabela cash_sessions para controlar aberturas, fechamentos e conferência de valores
 */

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    opening_amount REAL NOT NULL DEFAULT 0,
    closing_amount REAL,
    expected_amount REAL,
    difference REAL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
  );
`;

const expectedColumns = ['id', 'user_id', 'opened_at', 'closed_at', 'opening_amount', 'closing_amount', 'expected_amount', 'difference', 'status', 'notes'];

module.exports = {
  version: 5,
  description: 'Adicionar tabela cash_sessions para abertura/fechamento de caixa com conferência',

  up(adapter) {
    adapter.exec(SCHEMA_SQL);

    if (!adapter.queryOne("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_cash_sessions_status'")) {
      adapter.exec('CREATE INDEX idx_cash_sessions_status ON cash_sessions(status)');
    }
    if (!adapter.queryOne("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_cash_sessions_opened_at'")) {
      adapter.exec('CREATE INDEX idx_cash_sessions_opened_at ON cash_sessions(opened_at)');
    }
  },

  validate(adapter) {
    const tables = adapter.getTableList();
    if (!tables.includes('cash_sessions')) {
      throw new Error('Tabela cash_sessions não encontrada');
    }
    const columns = adapter.getTableColumns('cash_sessions').map(c => c.name);
    const missingCols = expectedColumns.filter(c => !columns.includes(c));
    if (missingCols.length > 0) {
      throw new Error(`Tabela cash_sessions com colunas ausentes: ${missingCols.join(', ')}`);
    }
  },
};
