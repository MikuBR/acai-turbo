#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const electronVersion = pkg.devDependencies.electron || pkg.devDependencies.electronVersion;
const arch = process.arch;
const modulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');

if (!electronVersion) {
  console.error('[rebuild] Electron version not found in package.json');
  process.exit(1);
}

console.log(`[rebuild] Electron version: ${electronVersion}`);
console.log(`[rebuild] Target arch: ${arch}`);
console.log(`[rebuild] Module path: ${modulePath}`);

if (!fs.existsSync(modulePath)) {
  console.error('[rebuild] better-sqlite3 not installed. Run npm install first.');
  process.exit(1);
}

const electronGypDir = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.electron-gyp');

console.log('[rebuild] Compiling better-sqlite3 for Electron ABI...');

try {
  execSync(
    `npx node-gyp rebuild --release --runtime=electron --target=${electronVersion} --arch=${arch} --dist-url=https://electronjs.org/headers`,
    {
      cwd: modulePath,
      stdio: 'inherit',
      env: { ...process.env, HOME: electronGypDir },
    }
  );
  console.log('[rebuild] better-sqlite3 compiled successfully for Electron');
} catch (e) {
  console.error('[rebuild] Compilation failed:', e.message);
  process.exit(1);
}

const nativeFile = path.join(modulePath, 'build', 'Release', 'better_sqlite3.node');
if (!fs.existsSync(nativeFile)) {
  console.error('[rebuild] Native binary not found after build:', nativeFile);
  process.exit(1);
}

console.log('[rebuild] Native binary:', nativeFile);
console.log('[rebuild] Done');
