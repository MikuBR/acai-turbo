// database/crypto.cjs
const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;     // AES-256
const IV_LEN = 12;
const TAG_LEN = 16;
const SENSITIVE_KEYS = [
  'ifood_client_secret',
  'ifood_access_token',
  'ifood_refresh_token',
  'ifood_token_expires_at',
];

let _masterKey = null;

function initMasterKey(safeStorage) {
  const stored = getStoredKey();
  if (stored) {
    if (safeStorage.isEncryptionAvailable()) {
      _masterKey = safeStorage.decryptString(Buffer.from(stored, 'base64'));
    } else {
      _masterKey = generateKey();
    }
  } else {
    _masterKey = generateKey();
    if (safeStorage.isEncryptionAvailable()) {
      persistKey(safeStorage.encryptString(_masterKey).toString('base64'));
    }
  }
}

function generateKey() {
  return crypto.randomBytes(KEY_LEN);
}

function getMasterKey() {
  if (!_masterKey) throw new Error('Master key not initialized');
  return _masterKey;
}

function encrypt(plaintext) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(encoded) {
  const key = getMasterKey();
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.slice(0, IV_LEN);
  const tag = buf.slice(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.slice(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

function isSensitiveKey(key) {
  return SENSITIVE_KEYS.includes(key);
}

const path = require('path');
const fs = require('fs');
const KEY_FILE_NAME = 'acai_wave_master.key';

function getKeyFilePath() {
  const { app } = require('electron');
  return path.join(app.getPath('userData'), KEY_FILE_NAME);
}

function getStoredKey() {
  try {
    return fs.readFileSync(getKeyFilePath(), 'utf8').trim();
  } catch {
    return null;
  }
}

function persistKey(encryptedBase64) {
  fs.writeFileSync(getKeyFilePath(), encryptedBase64, { mode: 0o600 });
}

module.exports = {
  initMasterKey,
  encrypt,
  decrypt,
  isSensitiveKey,
  SENSITIVE_KEYS,
};