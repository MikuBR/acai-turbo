/**
 * Migration 007: Adicionar coluna ifood_order_id e status em orders
 *
 * Adiciona:
 *   - orders.ifood_order_id: ID do pedido iFood para vinculação bidirecional
 *   - orders.status: status de preparo/entrega (preparing, ready, dispatched, etc.)
 *   - Índice idx_orders_ifood_order_id para busca rápida por ID iFood
 *
 * Permite que handlers iFood (start-preparation, ready-to-pickup, dispatch)
 * criem/atualizem a comanda vinculada na tabela orders.
 */
const up = (adapter) => {
  // Adicionar ifood_order_id (idempotente)
  try {
    adapter.exec('ALTER TABLE orders ADD COLUMN ifood_order_id TEXT');
    console.log('[migrate] Coluna ifood_order_id adicionada');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      throw e;
    }
  }

  // Adicionar status (idempotente)
  try {
    adapter.exec('ALTER TABLE orders ADD COLUMN status TEXT');
    console.log('[migrate] Coluna status adicionada');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      throw e;
    }
  }

  // Criar índice para busca por ifood_order_id (idempotente)
  try {
    adapter.exec('CREATE INDEX IF NOT EXISTS idx_orders_ifood_order_id ON orders(ifood_order_id)');
    console.log('[migrate] Índice idx_orders_ifood_order_id criado');
  } catch (e) {
    if (!e.message.includes('already exists')) {
      throw e;
    }
  }
};

const validate = (adapter) => {
  const columns = adapter.getTableColumns('orders').map(c => c.name);
  if (!columns.includes('ifood_order_id')) {
    throw new Error('Coluna ifood_order_id ausente em orders');
  }
  if (!columns.includes('status')) {
    throw new Error('Coluna status ausente em orders');
  }
  // Verificar índice
  const indexes = adapter.query("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_orders_ifood_order_id'");
  if (!indexes.length) {
    throw new Error('Índice idx_orders_ifood_order_id não foi criado');
  }
};

module.exports = {
  version: 7,
  description: 'Adicionar ifood_order_id e status em orders + índice para busca bidirecional',
  up,
  validate,
};