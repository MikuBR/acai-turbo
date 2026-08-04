#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const electronVersion = pkg.devDependencies.electron || pkg.devDependencies.electronVersion;
const nativeFile = path.join(__dirname, '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');

console.log('[check-abi] Electron version:', electronVersion);
console.log('[check-abi] Expected native binary:', nativeFile);

if (!fs.existsSync(nativeFile)) {
  console.error('[check-abi] FAIL: Native binary not found.');
  console.error('[check-abi] Run: npm run rebuild:native');
  process.exit(1);
}

const stats = fs.statSync(nativeFile);
console.log('[check-abi] Binary size:', (stats.size / 1024).toFixed(0), 'KB');
console.log('[check-abi] Modified at:', stats.mtime.toISOString());

try {
  const output = execSync('ELECTRON_RUN_AS_NODE=1 npx electron -e "console.log(process.versions.modules)"', { encoding: 'utf8', cwd: path.join(__dirname, '..') }).trim();
  console.log('[check-abi] Electron ABI:', output);
} catch (e) {
  console.error('[check-abi] FAIL: Could not get Electron ABI:', e.message);
  process.exit(1);
}

try {
  execSync('ELECTRON_RUN_AS_NODE=1 npx electron -e "require(\'better-sqlite3\')"', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });
  console.log('[check-abi] PASS: better-sqlite3 loads in Electron');
} catch (e) {
  console.error('[check-abi] FAIL: better-sqlite3 does not load in Electron');
  console.error('[check-abi] Error:', e.stderr ? e.stderr.toString().trim() : e.message);
  console.error('[check-abi] Run: npm run rebuild:native');
  process.exit(1);
}

console.log('[check-abi] All checks passed');
