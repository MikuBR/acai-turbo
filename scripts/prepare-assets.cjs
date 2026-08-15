#!/usr/bin/env node
/**
 * Prepara todos os assets de build (ícones, header do instalador e
 * templates de licença/EULA). Usado localmente e no CI.
 *
 * Uso: node scripts/prepare-assets.cjs
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');

function fail(msg) {
  console.error(`[prepare-assets] ERRO: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// 1. Ícones
console.log('\n=== Gerando ícones ===');
execSync('node scripts/generate-icons.cjs', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

// 2. Header do instalador
console.log('\n=== Gerando header do instalador ===');
execSync('node scripts/generate-installer-header.cjs', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

// 3. Templates de licença/EULA (com placeholders — dados pessoais preenchidos localmente)
console.log('\n=== Garantindo templates de licença/EULA ===');
execSync('node scripts/generate-license-templates.cjs', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

console.log('\n[prepare-assets] Done.');