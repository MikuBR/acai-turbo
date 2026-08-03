/**
 * Migration 002: Adicionar suporte a permutas como método de pagamento
 *
 * Adiciona:
 *   - is_exchange: flag (boleano) para identificar permutas (1) de vendas normais (0)
 *   - exchange_for: texto livre (o que foi recebido em troca)
 *
 * Permutas não são consideradas receita, tráfego ou ticket médio.
 * Elas serão exibidas em uma tabela de permutas separada no relatório.
 */

const up = (adapter) => {
  // Adicionar is_exchange (idempotente: ignora se a coluna já existir)
  try {
    adapter.exec('ALTER TABLE orders ADD COLUMN is_exchange BOOLEAN DEFAULT 0');
    console.log('[migrate] Coluna is_exchange adicionada');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      throw e;
    }
  }

  // Adicionar exchange_for (idempotente)
  try {
    adapter.exec('ALTER TABLE orders ADD COLUMN exchange_for TEXT DEFAULT NULL');
    console.log('[migrate] Coluna exchange_for adicionada');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      throw e;
    }
  }

  // Criar índices para performance nas queries de permuta
  const indexExists = (indexName) => {
    const row = adapter.queryOne("SELECT name FROM sqlite_master WHERE type='index' AND name=?", [indexName]);
    return !!row;
  };

  if (!indexExists('idx_orders_is_exchange')) {
    adapter.exec('CREATE INDEX idx_orders_is_exchange ON orders(is_exchange)');
    console.log('[migrate] Índice idx_orders_is_exchange criado');
  }

  if (!indexExists('idx_orders_exchange_for')) {
    adapter.exec('CREATE INDEX idx_orders_exchange_for ON orders(exchange_for)');
    console.log('[migrate] Índice idx_orders_exchange_for criado');
  }

  console.log('[migrate] Migration 002 concluída');
};

const down = (adapter) => {
  adapter.exec('DROP INDEX IF EXISTS idx_orders_is_exchange');
  adapter.exec('DROP INDEX IF EXISTS idx_orders_exchange_for');

  // SQLite >= 3.35.0 suporta DROP COLUMN; tentar com try/catch para versões antigas
  try {
    adapter.exec('ALTER TABLE orders DROP COLUMN is_exchange');
  } catch (e) {
    console.log('[migrate] DROP COLUMN is_exchange não suportado ou coluna inexistente:', e.message);
  }
  try {
    adapter.exec('ALTER TABLE orders DROP COLUMN exchange_for');
  } catch (e) {
    console.log('[migrate] DROP COLUMN exchange_for não suportado ou coluna inexistente:', e.message);
  }

  console.log('[migrate] Migration 002 revertida');
};

module.exports = { up, down, description: 'Adicionar is_exchange e exchange_for às orders' };
