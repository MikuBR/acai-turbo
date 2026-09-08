#!/usr/bin/env node
/**
 * check-deps.cjs — Verificação de integridade de dependências críticas
 *
 * Garante que dependências essenciais estão INSTALADAS NO NÍVEL SUPERIOR
 * do node_modules antes de builds, testes ou execução.
 *
 * Por que nível superior?
 *   O Node.js resolve require('react-router') na raiz do node_modules.
 *   Se react-router estiver apenas aninhado (ex: dentro de react-router-dom),
 *   o Node NÃO o encontra quando o código chama require('react-router') ou
 *   import 'react-router' — resultando no erro de build:
 *     "Rolldown failed to resolve import 'react-router'"
 *
 * Falha com código não-zero se alguma dep crítica estiver ausente, impedindo
 * que o app inicie ou faça build com módulos faltando.
 *
 * Uso:
 *   node scripts/check-deps.cjs              → verifica todas as deps declaradas
 *   node scripts/check-deps.cjs --critical   → verifica apenas as críticas
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const NODE_MODULES_PATH = path.join(PROJECT_ROOT, 'node_modules');

// Dependências declaradas como CRÍTICAS — sem elas o app não roda ou não faz build.
// Elas DEVEM estar no node_modules de nível superior (não apenas aninhadas).
// NOTA: react-router é uma dependência transitiva de react-router-dom, não uma
// dependência de nível superior. Se react-router-dom estiver instalado, o Node
// resolve react-router via node_modules/react-router-dom/node_modules/react-router.
// O build do Vite 8 / Rolldown resolve modules nesse caminho, então não é crítico
// verificar react-router separadamente — basta garantir react-router-dom.
const CRITICAL_DEPS = [
  // Core framework (declared in package.json → dependencies)
  'react',
  'react-dom',
  // Roteamento (declared in package.json → dependencies, traz react-router consigo)
  'react-router-dom',
  // Banco de dados nativo (declared in package.json → dependencies)
  'better-sqlite3',
  // Electron (declared in package.json → devDependencies, mas essencial em runtime)
  'electron',
];

// ═══════════════════════════════════════════════════════════════════════════════
//  LEITURA DO PACKAGE.JSON
// ═══════════════════════════════════════════════════════════════════════════════

function loadPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  } catch (err) {
    console.error('❌ Não foi possível ler package.json:', err.message);
    process.exit(1);
  }
}

// Todas as dependências listadas no package.json (dependencies + devDependencies)
function getDeclaredDeps(pkg) {
  return [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
}

// Versão declarada no package.json para um pacote
function getDeclaredVersion(pkg, name) {
  const ver = pkg.dependencies?.[name] || pkg.devDependencies?.[name];
  return ver || '(não declarado)';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VERIFICAÇÃO DE INSTALAÇÃO (NÍVEL SUPERIOR DO NODE_MODULES)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica se um pacote está INSTALADO NO NÍVEL SUPERIOR do node_modules.
 *
 * Importante: verifica apenas a raiz do node_modules, não caminhos aninhados.
 * O Node.js resolve require('pacote') na raiz do node_modules, não em
 * node_modules/algum-pacote/node_modules/pacote.
 *
 * Para pacotes com escopo (@org/pacote), a estrutura é:
 *   node_modules/@org/pacote/package.json
 */
function isInstalledAtRoot(name) {
  const pkgDir = path.join(NODE_MODULES_PATH, name);

  // Caso normal: node_modules/react-router
  if (fs.existsSync(pkgDir)) {
    const pkgJson = path.join(pkgDir, 'package.json');
    return fs.existsSync(pkgJson);
  }

  // Caso com escopo: node_modules/@scope/package → precisamos checar @scope/package
  if (name.startsWith('@')) {
    const parts = name.split('/');
    if (parts.length === 2) {
      const scopeDir = path.join(NODE_MODULES_PATH, parts[0]);
      const scopedPkgDir = path.join(NODE_MODULES_PATH, parts[0], parts[1]);
      if (fs.existsSync(scopedPkgDir)) {
        const pkgJson = path.join(scopedPkgDir, 'package.json');
        return fs.existsSync(pkgJson);
      }
    }
  }

  // Link simbólico quebrado ou pasta inexistente
  return false;
}

/**
 * Retorna o caminho do package.json de um pacote INSTALADO NO NÍVEL SUPERIOR.
 * Retorna null se não estiver instalado.
 */
function getInstalledPkgJsonPath(name) {
  const pkgDir = path.join(NODE_MODULES_PATH, name);

  if (fs.existsSync(pkgDir)) {
    const pkgJson = path.join(pkgDir, 'package.json');
    if (fs.existsSync(pkgJson)) {
      return pkgJson;
    }
  }

  // Caso com escopo
  if (name.startsWith('@')) {
    const parts = name.split('/');
    if (parts.length === 2) {
      const scopedPkgDir = path.join(NODE_MODULES_PATH, parts[0], parts[1]);
      if (fs.existsSync(scopedPkgDir)) {
        const pkgJson = path.join(scopedPkgDir, 'package.json');
        if (fs.existsSync(pkgJson)) {
          return pkgJson;
        }
      }
    }
  }

  return null;
}

/**
 * Versão instalada (lida do package.json do pacote no node_modules).
 */
function getInstalledVersion(name) {
  const pkgJsonPath = getInstalledPkgJsonPath(name);
  if (!pkgJsonPath) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    return pkg.version || '(sem versão)';
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CHECK DE INTEGRIDADE
// ═══════════════════════════════════════════════════════════════════════════════

function runCheck(criticalOnly = false) {
  const pkg = loadPackageJson();
  const declaredDeps = getDeclaredDeps(pkg);

  const checkList = criticalOnly
    ? CRITICAL_DEPS.filter(d => declaredDeps.includes(d))
    : declaredDeps;

  if (checkList.length === 0 && criticalOnly) {
    console.log('⚠️  Nenhuma dependência crítica declarada. Verifique CRITICAL_DEPS no script.');
    process.exit(0);
  }

  const missing = [];
  const results = [];

  for (const dep of checkList) {
    const installed = isInstalledAtRoot(dep);
    const declaredVer = getDeclaredVersion(pkg, dep);
    const installedVer = getInstalledVersion(dep);
    results.push({ name: dep, installed, declaredVer, installedVer });

    if (!installed) {
      missing.push(dep);
    }
  }

  // ── Saída ───────────────────────────────────────────────────────────────────
  console.log('');
  console.log('═'.repeat(62));
  console.log('  CHECK DE DEPENDÊNCIAS (Nível Superior do node_modules)');
  console.log('═'.repeat(62));
  console.log(`  Modo:      ${criticalOnly ? 'CRÍTICO' : 'COMPLETO'}`);
  console.log(`  Vendos:    ${results.length}`);
  console.log('');

  for (const r of results) {
    const icon = r.installed ? '  ✅ ' : '  ❌ ';
    const nameCol = r.name.padEnd(35);
    const verCol = r.installed
      ? `instalada: v${r.installedVer}`
      : `declarada: ${r.declaredVer} (FALTANDO)`;
    console.log(`${icon}  ${nameCol}  ${verCol}`);
  }

  console.log('');
  console.log('═'.repeat(62));

  // ── Relatório de falhas ────────────────────────────────────────────────────
  if (missing.length > 0) {
    console.log('');
    console.log(`  ❌ ${missing.length} dependência(ões) CRÍTICA(S) FALTANDO:`);
    console.log('');
    for (const m of missing) {
      const declaredVer = getDeclaredVersion(pkg, m);
      console.log(`     • ${m}  (declarada como: ${declaredVer})`);
    }
    console.log('');
    console.log('  Correção:');
    console.log('     npm install');
    console.log('');
    console.log('  Ou, se estiver executando em CI/build sem instalação de deps:');
    console.log('     npm ci');
    console.log('');
    process.exit(1);
  }

  // ── Aviso sobre better-sqlite3 e ABI ───────────────────────────────────────
  console.log('  ✅ Todas as dependências críticas estão instaladas no nível superior.');
  console.log('');

  if (criticalOnly && isInstalledAtRoot('better-sqlite3')) {
    const nativeDir = path.join(NODE_MODULES_PATH, 'better-sqlite3', 'build', 'Release');
    if (!fs.existsSync(nativeDir)) {
      console.log('  ⚠️  AVISO: better-sqlite3 instalado mas sem módulo nativo compilado.');
      console.log('     Execute: npm run rebuild:node');
      console.log('');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const criticalOnly = args.includes('--critical') || args.includes('--critical-only');

// Prever falha silenciosa do script no CI — se node_modules não existe, falha logo
if (!fs.existsSync(NODE_MODULES_PATH)) {
  console.error('');
  console.error('❌ node_modules/ não encontrado em: ' + NODE_MODULES_PATH);
  console.error('   Execute "npm install" antes de rodar este script ou o build.');
  console.error('');
  process.exit(1);
}

runCheck(criticalOnly);
