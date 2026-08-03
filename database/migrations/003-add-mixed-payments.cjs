/**
 * Migration 003: Adicionar suporte a pagamentos mistos e separados
 *
 * Adiciona:
 *   - Tabela order_payments para múltiplos métodos de pagamento por pedido
 *   - Colunas total_paid e payment_status à tabela orders (compatibilidade retroativa)
 *   - Backfill de pedidos antigos para order_payments
 *
 * Permuta continua sendo representada por is_exchange e exchange_for (em orders)
 */

module.exports = {
  description: 'Adicionar order_payments, total_paid e payment_status às orders',

  up(adapter) {
    console.log('[migrate] Executando migration 003');

    // 1. Nova tabela de pagamentos
    adapter.exec(`
      CREATE TABLE IF NOT EXISTS order_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      );
    `);

    // 2. Adicionar total_paid (idempotente)
    try {
      adapter.exec('ALTER TABLE orders ADD COLUMN total_paid REAL DEFAULT 0');
      console.log('[migrate] Coluna total_paid adicionada');
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }

    // 3. Adicionar payment_status (idempotente)
    try {
      adapter.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'PAID'");
      console.log('[migrate] Coluna payment_status adicionada');
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }

    // 4. Índices para performance
    const indexExists = (indexName) => {
      const row = adapter.queryOne("SELECT name FROM sqlite_master WHERE type='index' AND name=?", [indexName]);
      return !!row;
    };

    if (!indexExists('idx_order_payments_order_id')) {
      adapter.exec('CREATE INDEX idx_order_payments_order_id ON order_payments(order_id)');
      console.log('[migrate] Índice idx_order_payments_order_id criado');
    }

    if (!indexExists('idx_order_payments_method')) {
      adapter.exec('CREATE INDEX idx_order_payments_method ON order_payments(payment_method)');
      console.log('[migrate] Índice idx_order_payments_method criado');
    }

    // 5. Backfill: converter pedidos antigos que ainda não têm registro em order_payments.
    //    Evita duplicação verificando ausência de pagamento existente para o pedido.
    const oldOrders = adapter.query(`
      SELECT o.id, o.payment_method, o.total as amount
      FROM orders o
      WHERE o.payment_method IS NOT NULL
        AND o.payment_method != ''
        AND NOT EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id)
    `);

    if (oldOrders.length === 0) {
      console.log('[migrate] Nenhum pedido antigo encontrado para backfill (ou já migrados)');
    } else {
      const insertStmt = 'INSERT INTO order_payments (order_id, payment_method, amount) VALUES (?, ?, ?)';
      for (const o of oldOrders) {
        adapter.run(insertStmt, [o.id, o.payment_method, o.amount]);
      }
      console.log(`[migrate] Backfill concluído: ${oldOrders.length} pedido(s) migrados para order_payments`);
    }

    // 6. Atualizar total_paid e payment_status a partir de order_payments.
    //    Usa exec() com SQL puro (sem parâmetros) para o UPDATE em massa.
    adapter.exec(`
      UPDATE orders
      SET total_paid = COALESCE((
        SELECT SUM(amount) FROM order_payments WHERE order_id = orders.id
      ), 0),
      payment_status = CASE
        WHEN COALESCE((
          SELECT SUM(amount) FROM order_payments WHERE order_id = orders.id
        ), 0) <= 0 THEN 'PENDING'
        ELSE 'PAID'
      END
    `);
    console.log('[migrate] total_paid e payment_status atualizados');

    console.log('[migrate] Migration 003 aplicada');
  },

  down(adapter) {
    // Excluir order_payments
    try {
      adapter.exec('DROP TABLE IF EXISTS order_payments');
      console.log('[migrate] order_payments removida');
    } catch (e) {
      console.log('[migrate] DROP TABLE order_payments falhou:', e.message);
    }

    // Remover colunas adicionadas (SQLite >= 3.35.0)
    try {
      adapter.exec('ALTER TABLE orders DROP COLUMN total_paid');
    } catch (e) {
      console.log('[migrate] DROP COLUMN total_paid não suportado:', e.message);
    }
    try {
      adapter.exec('ALTER TABLE orders DROP COLUMN payment_status');
    } catch (e) {
      console.log('[migrate] DROP COLUMN payment_status não suportado:', e.message);
    }

    console.log('[migrate] Migration 003 revertida');
  },
};
