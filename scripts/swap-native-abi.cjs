#!/usr/bin/env node
/**
 * Solução automática para NODE_MODULE_VERSION mismatch
 *
 * Problema: better-sqlite3 precisa ser compilado contra:
 *  - Node.js (ABI 127) para rodar `npm test` (Vitest)
 *  - Electron (ABI 119) para rodar a aplicação
 *
 * Uso:
 *   node scripts/swap-native-abi.cjs electron    # Para rodar a app
 *   node scripts/swap-native-abi.cjs node        # Para rodar testes
 *   node scripts/swap-native-abi.cjs status      # Verifica estado atual
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
const buildDir = path.join(modulePath, 'build');
const releaseDir = path.join(buildDir, 'Release');
const cacheDir = path.join(modulePath, '.abi-cache');
const targetFile = path.join(releaseDir, 'better_sqlite3.node');

const mode = process.argv[2] || 'status';

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

function getCurrentAbi() {
  try {
    require('better-sqlite3');
    const Database = require('better-sqlite3');
    const test = new Database(':memory:');
    test.close();
    return 'node';
  } catch (e) {
    if (e.message.includes('NODE_MODULE_VERSION 119')) return 'electron';
    if (e.message.includes('NODE_MODULE_VERSION 127')) return 'node-broken';
    return 'unknown';
  }
}

function buildFor(target) {
  console.log(`[swap] Rebuilding better-sqlite3 for ${target}...`);
  if (target === 'electron') {
    execSync('npx electron-rebuild -f -w better-sqlite3', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
  } else {
    execSync('npm rebuild better-sqlite3', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
  }
}

function cache(target) {
  if (!fs.existsSync(targetFile)) {
    console.error('[swap] Native binary not found, building first...');
    buildFor(target);
  }
  const cacheFile = path.join(cacheDir, `better_sqlite3.${target}.node`);
  fs.copyFileSync(targetFile, cacheFile);
  console.log(`[swap] Cached ${target} build:`, cacheFile);
}

function restore(target) {
  const cacheFile = path.join(cacheDir, `better_sqlite3.${target}.node`);
  if (!fs.existsSync(cacheFile)) {
    console.log(`[swap] No cached ${target} build, building...`);
    buildFor(target);
    cache(target);
    return;
  }
  fs.copyFileSync(cacheFile, targetFile);
  console.log(`[swap] Restored ${target} build from cache`);
}

switch (mode) {
  case 'electron':
    cache('electron');
    restore('electron');
    console.log('[swap] ✅ Ready for Electron (ABI 119)');
    break;

  case 'node':
    cache('node');
    restore('node');
    console.log('[swap] ✅ Ready for Node.js (ABI 127)');
    break;

  case 'status': {
    const current = getCurrentAbi();
    console.log('[swap] Current build:', current);
    console.log('[swap] Run `node scripts/swap-native-abi.cjs electron` to swap to Electron');
    console.log('[swap] Run `node scripts/swap-native-abi.cjs node` to swap to Node.js');
    break;
  }

  default:
    console.error('[swap] Unknown mode:', mode);
    console.error('[swap] Use: electron | node | status');
    process.exit(1);
}
