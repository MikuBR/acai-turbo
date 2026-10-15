/**
 * Resolve o binding nativo correto do better-sqlite3 em runtime.
 * 
 * Detecta se está rodando em Node.js ou Electron e retorna o binário apropriado.
 * Elimina a necessidade de swap manual de ABI.
 * 
 * @module database/db-binding
 */

const path = require('path');
const fs = require('fs');

/**
 * Resolve o caminho do binding nativo correto.
 * @returns {string} Caminho absoluto para o arquivo .node
 * @throws {Error} Se nenhum binding for encontrado
 */
function resolveNativeBinding() {
  const modulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
  const buildDir = path.join(modulePath, 'build', 'Release');
  
  const isElectron = !!process.versions.electron;
  const suffix = isElectron ? 'electron' : 'node';
  const specificBinary = path.join(buildDir, `better_sqlite3.node-${suffix}.node`);
  
  if (fs.existsSync(specificBinary)) {
    return specificBinary;
  }
  
  // Fallback para o binário padrão (compatibilidade)
  const defaultBinary = path.join(buildDir, 'better_sqlite3.node');
  if (fs.existsSync(defaultBinary)) {
    console.warn(`[db-binding] Prebuild ${suffix} não encontrado, usando binário padrão`);
    return defaultBinary;
  }
  
  throw new Error(
    `Native binding do better-sqlite3 não encontrado. ` +
    `Execute: node scripts/install-sqlite-bindings.cjs`
  );
}

/**
 * Verifica se o binding está disponível para o runtime atual.
 * @returns {boolean}
 */
function isBindingAvailable() {
  try {
    resolveNativeBinding();
    return true;
  } catch {
    return false;
  }
}

module.exports = { resolveNativeBinding, isBindingAvailable };
