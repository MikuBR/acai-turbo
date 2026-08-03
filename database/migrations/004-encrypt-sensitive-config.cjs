// database/migrations/004-encrypt-sensitive-config.cjs
const description = 'Criptografar chaves sensíveis existentes na tabela config (iFood)';

function up(adapter) {
  const cryptoModule = require('../crypto.cjs');
  const { encrypt, isSensitiveKey, getMasterKey } = cryptoModule;
  
  try { const _ = getMasterKey(); } catch { return; }
  
  const sensitiveKeys = ['ifood_client_secret', 'ifood_access_token', 'ifood_refresh_token', 'ifood_token_expires_at'];
  
  for (const cfgKey of sensitiveKeys) {
    const row = adapter.queryOne('SELECT value FROM config WHERE key = ?', [cfgKey]);
    if (row && row.value) {
      try {
        cryptoModule.decrypt(row.value);
        continue;
      } catch {
        const encrypted = encrypt(row.value);
        adapter.run('UPDATE config SET value = ? WHERE key = ?', [encrypted, cfgKey]);
        console.log(`[migrate] Chave '${cfgKey}' criptografada`);
      }
    }
  }
}

module.exports = { version: 4, description, up };