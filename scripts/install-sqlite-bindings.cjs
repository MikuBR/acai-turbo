#!/usr/bin/env node
/**
 * Instala prebuilds do better-sqlite3 para Node.js e Electron.
 * 
 * Elimina a necessidade de swap-native-abi.cjs manual.
 * Baixa binários pré-compilados para ambos os ABIs:
 *   - Node.js (ABI 127) para testes Vitest
 *   - Electron (ABI 128) para a aplicação
 * 
 * Uso: node scripts/install-sqlite-bindings.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const modulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
const buildDir = path.join(modulePath, 'build', 'Release');
const cacheDir = path.join(modulePath, '.abi-cache');

// Garantir diretórios
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(cacheDir, { recursive: true });

// Detectar versão real do Node.js (não hardcode)
const nodeMajor = process.versions.node.split('.')[0];
const nodeTarget = process.versions.node; // ex: "26.7.0"
const electronTarget = '32.3.3'; // Electron ABI 128

/**
 * Instala prebuild para um runtime específico.
 * @param {'node'|'electron'} runtime 
 * @param {string} target 
 * @param {string} destFile 
 */
function installPrebuild(runtime, target, destFile) {
  if (fs.existsSync(destFile)) {
    console.log(`[install-sqlite] ✅ ${runtime} prebuild já existe`);
    return;
  }
  
  console.log(`[install-sqlite] Baixando prebuild ${runtime} (target ${target})...`);
  
  try {
    // Tentar baixar prebuild
    execSync(
      `npx prebuild-install --runtime ${runtime} --target ${target} --arch x64`,
      { cwd: modulePath, stdio: 'inherit' }
    );
    
    // Renomear para sufixo do runtime
    const defaultBinary = path.join(buildDir, 'better_sqlite3.node');
    if (fs.existsSync(defaultBinary) && !fs.existsSync(destFile)) {
      fs.renameSync(defaultBinary, destFile);
    }
    
    console.log(`[install-sqlite] ✅ ${runtime} prebuild instalado`);
  } catch (e) {
    console.warn(`[install-sqlite] ⚠️ Prebuild ${runtime} falhou: ${e.message}`);
    console.log(`[install-sqlite] Tentando compilação nativa para ${runtime}...`);
    
    try {
      if (runtime === 'electron') {
        execSync('npx electron-rebuild -f -w better-sqlite3', { 
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit' 
        });
      } else {
        execSync('npm rebuild better-sqlite3', { 
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit' 
        });
      }
      console.log(`[install-sqlite] ✅ Compilação nativa ${runtime} concluída`);
    } catch (e2) {
      console.error(`[install-sqlite] ❌ Falha completa para ${runtime}:`, e2.message);
      process.exitCode = 1;
    }
  }
}

console.log('[install-sqlite] Iniciando instalação de prebuilds...');

// Flags permitem instalar um runtime específico (mantém a semântica dos
// scripts rebuild:node / rebuild:native):
//   --node-only      instala apenas o binding do Node
//   --electron-only  instala apenas o binding do Electron
const argv = process.argv.slice(2);
const nodeOnly = argv.includes('--node-only');
const electronOnly = argv.includes('--electron-only');

const nodeBinary = path.join(buildDir, 'better_sqlite3.node-node.node');
const electronBinary = path.join(buildDir, 'better_sqlite3.node-electron.node');

if (!electronOnly) {
  installPrebuild('node', nodeTarget, nodeBinary);
}
if (!nodeOnly) {
  installPrebuild('electron', electronTarget, electronBinary);
}

// O binário padrão (better_sqlite3.node) é usado por requires diretos
// (ex.: testes Vitest) e deve ser SEMPRE o build do Node, independentemente
// de qual runtime instalou por último. Sobrescrevemos de forma determinística.
const defaultBinary = path.join(buildDir, 'better_sqlite3.node');
if (fs.existsSync(nodeBinary)) {
  fs.copyFileSync(nodeBinary, defaultBinary);
  console.log('[install-sqlite] ✅ Binário padrão sincronizado com o build Node (fallback determinístico para testes)');
} else if (!electronOnly && !fs.existsSync(defaultBinary)) {
  console.warn('[install-sqlite] ⚠️ Build Node indisponível — binário padrão não pôde ser criado');
}

console.log('[install-sqlite] ✅ Concluído');
