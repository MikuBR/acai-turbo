/**
 * Migration 006: Adicionar senha de gerente por usuário
 *
 * Adiciona:
 *   - users.manager_password: hash bcrypt da senha de gerente do usuário
 *   - users.must_change_manager_password: flag para forçar definição inicial
 *
 * A senha de gerente deixa de ser global (config.manager_password) e passa
 * a ser vinculada a cada usuário, eliminando risco de senha padrão compartilhada.
 */
const up = (adapter) => {
  // Adicionar manager_password (idempotente)
  try {
    adapter.exec('ALTER TABLE users ADD COLUMN manager_password TEXT');
    console.log('[migrate] Coluna manager_password adicionada');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      throw e;
    }
  }

  // Adicionar must_change_manager_password (idempotente)
  try {
    adapter.exec('ALTER TABLE users ADD COLUMN must_change_manager_password INTEGER DEFAULT 0');
    console.log('[migrate] Coluna must_change_manager_password adicionada');
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      throw e;
    }
  }

  // Marcar usuários existentes sem senha de gerente para forçar definição
  adapter.exec('UPDATE users SET must_change_manager_password = 1 WHERE manager_password IS NULL');
};

const validate = (adapter) => {
  const columns = adapter.getTableColumns('users').map(c => c.name);
  if (!columns.includes('manager_password')) {
    throw new Error('Coluna manager_password ausente em users');
  }
  if (!columns.includes('must_change_manager_password')) {
    throw new Error('Coluna must_change_manager_password ausente em users');
  }
};

module.exports = {
  version: 6,
  description: 'Adicionar senha de gerente por usuário (elimina senha global)',
  up,
  validate,
};
EOF