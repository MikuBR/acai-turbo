#!/usr/bin/env node
/**
 * bump-version.cjs — Versionamento semântico para Açaí Wave
 *
 * Uso:
 *   node scripts/bump-version.cjs patch   # 1.3.4 → 1.3.5
 *   node scripts/bump-version.cjs minor   # 1.3.x → 1.4.0
 *   node scripts/bump-version.cjs major   # 1.x → 2.0.0
 *   node scripts/bump-version.cjs 1.4.0   # set version explícita
 *   node scripts/bump-version.cjs status  # mostrar versão atual
 *
 * O script:
 *   1. Lê package.json
 *   2. Calcula nova versão
 *   3. Atualiza package.json
 *   4. Cria commit "chore: bump version X.Y.Z → W.V.U"
 *   5. Cria tag git vW.V.U (annotated)
 *   6. Não faz push — isso fica a cargo do desenvolvedor
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PKG_PATH = path.join(__dirname, '..', 'package.json');
const commitMsg = (oldVer, newVer) => `chore: bump version ${oldVer} → ${newVer}`;
const tagMsg = (newVer) => `Release v${newVer}`;

function readPackage() {
  if (!fs.existsSync(PKG_PATH)) {
    console.error('❌ package.json não encontrado em', PKG_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
}

function writePackage(pkg) {
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
}

function parseVersion(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/);
  if (!m) throw new Error(`Versão inválida: ${v}`);
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] || '', build: m[5] || '' };
}

function formatVersion(v) {
  return `${v.major}.${v.minor}.${v.patch}${v.pre}`;
}

function bumpPatch(pkg) {
  const v = parseVersion(pkg.version);
  v.patch += 1;
  v.pre = '';
  return v;
}

function bumpMinor(pkg) {
  const v = parseVersion(pkg.version);
  v.minor += 1;
  v.patch = 0;
  v.pre = '';
  return v;
}

function bumpMajor(pkg) {
  const v = parseVersion(pkg.version);
  v.major += 1;
  v.minor = 0;
  v.patch = 0;
  v.pre = '';
  return v;
}

function gitTagExists(tag) {
  try {
    execSync(`git rev-parse "${tag}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function changelogHasVersion(ver) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) return false;
  const content = fs.readFileSync(changelogPath, 'utf8');
  const tagPattern = new RegExp(`## \\[${ver}\\]`);
  return tagPattern.test(content);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
  } catch (err) {
    return (err.stdout || err.message || '').trim();
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === 'status' || args[0] === '-h' || args[0] === '--help') {
    const pkg = readPackage();
    console.log(`📦 Versão atual: ${pkg.version}`);
    console.log(`📌 Tags existentes:`);
    const tags = run('git tag -l "v*"').split('\n').filter(Boolean).sort().reverse();
    tags.slice(0, 10).forEach(t => console.log(`   ${t}`));
    if (args[0] === 'status' || args[0] === '-h' || args[0] === '--help') process.exit(0);
    console.log('');
    console.log('Uso:');
    console.log('  node scripts/bump-version.cjs patch     → bump patch (1.3.4 → 1.3.5)');
    console.log('  node scripts/bump-version.cjs minor     → bump minor (1.3.x → 1.4.0)');
    console.log('  node scripts/bump-version.cjs major     → bump major (1.x → 2.0.0)');
    console.log('  node scripts/bump-version.cjs 1.4.0     → set version explícita');
    process.exit(0);
  }

  const pkg = readPackage();
  const oldVer = pkg.version;
  let newVer;

  if (args[0] === 'patch') {
    newVer = bumpPatch(pkg);
  } else if (args[0] === 'minor') {
    newVer = bumpMinor(pkg);
  } else if (args[0] === 'major') {
    newVer = bumpMajor(pkg);
  } else {
    // versão explícita
    const explicit = parseVersion(args[0]);
    if (explicit.version !== args[0]) {
      console.error('❌ Versão explícita inválida:', args[0]);
      process.exit(1);
    }
    newVer = explicit;
  }

  const newVerStr = formatVersion(newVer);
  const tagName = `v${newVerStr}`;

  // Validações
  if (gitTagExists(tagName)) {
    console.error(`❌ Tag ${tagName} já existe. Remova-a primeiro ou use outra versão.`);
    process.exit(1);
  }

  // Verifica se o CHANGELOG tem entrada para a versão que será criada
  // (permissivo: se estiver em desenvolvimento e não tiver adicionado ainda, apenas avisa)
  if (!changelogHasVersion(newVerStr)) {
    console.log(`⚠️  CHANGELOG.md não tem entrada para [${newVerStr}]. Lembre-se de adicionar.`);
  }

  const dirty = run('git status --porcelain');
  if (dirty) {
    console.error('❌ Working tree sujo. Commit ou stash antes de bumpar versão.');
    console.error('   Arquivos modificados:');
    dirty.split('\n').forEach(l => console.error('   ', l));
    process.exit(1);
  }

  console.log(`📦 ${oldVer} → ${newVerStr}`);
  console.log(`🏷️  Tag: ${tagName}`);

  // 1. Atualiza package.json
  pkg.version = newVerStr;
  writePackage(pkg);
  console.log('✅ package.json atualizado');

  // 2. Commit
  try {
    run(`git add package.json`);
    run(`git commit -m "${commitMsg(oldVer, newVerStr)}"`);
    console.log('✅ Commit criado');
  } catch (err) {
    console.error('❌ Falha ao criar commit:', err.message);
    process.exit(1);
  }

  // 3. Tag annotated
  try {
    run(`git tag -a ${tagName} -m "${tagMsg(newVerStr)}"`);
    console.log('✅ Tag criada');
  } catch (err) {
    console.error('❌ Falha ao criar tag:', err.message);
    process.exit(1);
  }

  console.log('');
  console.log(`📌 Próximos passos:`);
  console.log(`   git push origin main`);
  console.log(`   git push origin ${tagName}`);
  console.log(`   gh release create ${tagName} --generate-notes --target main`);
  console.log('');
  console.log(`💡 Ou use workflow existente: despache release.yml com tag ${tagName}`);
}

main();
