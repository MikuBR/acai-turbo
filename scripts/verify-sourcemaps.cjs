#!/usr/bin/env node
// ============================================================
// verify-sourcemaps.cjs — Verificação de source maps no CI/CD
// ============================================================
// Responsável por:
// - Verificar se os source maps foram gerados no build
// - Validar a integridade dos arquivos .map
// - Confirmar que o upload ao Sentry foi realizado (quando token disponível)
// - Reportar erros claros para debug no CI
//
// Uso:
//   node scripts/verify-sourcemaps.cjs [--dist-dir dist] [--strict]
//
// Exit codes:
//   0 = sucesso (source maps válidos)
//   1 = falha (source maps ausentes ou inválidos)
// ============================================================

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const distDir = args.includes('--dist-dir') ? args[args.indexOf('--dist-dir') + 1] : 'dist';
const strict = args.includes('--strict');

// Colors para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`━━━ ${title} ━━━`, 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

// ============================================================
// Verificações
// ============================================================

function checkDistExists() {
  logSection('Verificando diretório de build');

  const distPath = path.resolve(distDir);
  if (!fs.existsSync(distPath)) {
    logError(`Diretório '${distDir}' não encontrado`);
    logInfo('Execute "npm run build" antes de verificar source maps');
    return false;
  }

  logSuccess(`Diretório '${distDir}' encontrado`);
  return true;
}

function findSourceMaps() {
  logSection('Procurando source maps');

  const distPath = path.resolve(distDir);
  const assetsPath = path.join(distPath, 'assets');

  if (!fs.existsSync(assetsPath)) {
    logError(`Diretório 'assets/' não encontrado em '${distDir}'`);
    return [];
  }

  const files = fs.readdirSync(assetsPath);
  const mapFiles = files.filter(f => f.endsWith('.map'));

  if (mapFiles.length === 0) {
    logError('Nenhum arquivo .map encontrado em dist/assets/');
    logInfo('Verifique se "sourcemap: true" está configurado no vite.config.js');
    return [];
  }

  logSuccess(`${mapFiles.length} arquivo(s) .map encontrado(s)`);
  return mapFiles.map(f => path.join(assetsPath, f));
}

function validateSourceMap(mapFilePath) {
  const fileName = path.basename(mapFilePath);
  const issues = [];

  // Verificar se o arquivo não está vazio
  const stats = fs.statSync(mapFilePath);
  if (stats.size === 0) {
    issues.push('Arquivo .map está vazio');
    return { valid: false, issues };
  }

  // Verificar tamanho mínimo (um source map válido tem pelo menos ~100 bytes)
  if (stats.size < 100) {
    issues.push(`Arquivo muito pequeno (${stats.size} bytes) — provavelmente inválido`);
  }

  // Tentar parsear o JSON
  let content;
  try {
    const raw = fs.readFileSync(mapFilePath, 'utf-8');
    content = JSON.parse(raw);
  } catch (err) {
    issues.push(`JSON inválido: ${err.message}`);
    return { valid: false, issues };
  }

  // Verificar estrutura do source map
  if (content.version !== 3) {
    issues.push(`Versão do source map inválida: ${content.version} (esperado: 3)`);
  }

  if (!content.sources || !Array.isArray(content.sources)) {
    issues.push('Campo "sources" ausente ou inválido');
  } else if (content.sources.length === 0) {
    issues.push('Campo "sources" está vazio');
  }

  if (!content.mappings || typeof content.mappings !== 'string') {
    issues.push('Campo "mappings" ausente ou inválido');
  } else if (content.mappings.length === 0) {
    issues.push('Campo "mappings" está vazio');
  }

  // Verificar se tem sourcesContent (código fonte embutido)
  if (!content.sourcesContent || !Array.isArray(content.sourcesContent)) {
    issues.push('Campo "sourcesContent" ausente — código fonte não embutido');
  } else if (content.sourcesContent.length === 0) {
    issues.push('Campo "sourcesContent" está vazio');
  } else {
    // Verificar se pelo menos alguns sourcesContent não são null
    const nonNullContent = content.sourcesContent.filter(c => c !== null && c !== '');
    if (nonNullContent.length === 0) {
      issues.push('Todos os "sourcesContent" estão null ou vazios');
    }
  }

  // Verificar se o arquivo JS correspondente existe
  const jsFileName = mapFilePath.replace(/\.map$/, '');
  if (!fs.existsSync(jsFileName)) {
    issues.push(`Arquivo JS correspondente não encontrado: ${path.basename(jsFileName)}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      version: content.version,
      sourcesCount: content.sources?.length || 0,
      sourcesContentCount: content.sourcesContent?.filter(c => c !== null && c !== '').length || 0,
      mappingsLength: content.mappings?.length || 0,
      fileSize: stats.size,
    },
  };
}

function validateAllSourceMaps(mapFiles) {
  logSection('Validando source maps');

  let allValid = true;
  const results = [];

  for (const mapFile of mapFiles) {
    const fileName = path.basename(mapFile);
    const result = validateSourceMap(mapFile);
    results.push({ fileName, ...result });

    if (result.valid) {
      logSuccess(`${fileName}`);
      logInfo(`  version: ${result.stats.version}, sources: ${result.stats.sourcesCount}, mappings: ${result.stats.mappingsLength} chars`);
      logInfo(`  sourcesContent: ${result.stats.sourcesContentCount} arquivos com código fonte`);
      logInfo(`  tamanho: ${(result.stats.fileSize / 1024).toFixed(2)} KB`);
    } else {
      allValid = false;
      logError(`${fileName}`);
      for (const issue of result.issues) {
        logError(`  - ${issue}`);
      }
    }
  }

  return { allValid, results };
}

function checkSentryUpload() {
  logSection('Verificando upload ao Sentry');

  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG || 'acai-wave';
  const project = process.env.SENTRY_PROJECT || 'acai-wave-pdv';
  const version = process.env.VITE_APP_VERSION || 'unknown';

  if (!authToken) {
    logWarning('SENTRY_AUTH_TOKEN não configurado');
    logInfo('Source maps NÃO foram enviados ao Sentry');
    logInfo('Configure SENTRY_AUTH_TOKEN para habilitar o upload automático');
    return { uploaded: false, reason: 'no_token' };
  }

  logInfo(`Org: ${org}`);
  logInfo(`Project: ${project}`);
  logInfo(`Release: ${version}`);
  logInfo('Token configurado — upload deve ter sido realizado durante o build');

  // Verificar se os source maps foram deletados (sinal de upload bem-sucedido)
  const distPath = path.resolve(distDir);
  const assetsPath = path.join(distPath, 'assets');
  const files = fs.readdirSync(assetsPath);
  const mapFiles = files.filter(f => f.endsWith('.map'));

  if (mapFiles.length === 0 && authToken) {
    logSuccess('Source maps foram deletados após upload (comportamento esperado)');
    return { uploaded: true, reason: 'deleted_after_upload' };
  }

  if (mapFiles.length > 0 && authToken) {
    logWarning('Source maps ainda presentes no dist/ — upload pode ter falhado');
    logInfo('Verifique os logs do build para erros do @sentry/vite-plugin');
    return { uploaded: false, reason: 'maps_still_present' };
  }

  return { uploaded: true, reason: 'token_present' };
}

function checkJSFilesReferenceSourceMaps() {
  logSection('Verificando referências a source maps nos arquivos JS');

  const distPath = path.resolve(distDir);
  const assetsPath = path.join(distPath, 'assets');

  if (!fs.existsSync(assetsPath)) {
    return { valid: false, reason: 'no_assets_dir' };
  }

  const files = fs.readdirSync(assetsPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  let jsWithMapRef = 0;
  let jsWithoutMapRef = 0;
  const missingRefs = [];

  for (const jsFile of jsFiles) {
    const jsPath = path.join(assetsPath, jsFile);
    const content = fs.readFileSync(jsPath, 'utf-8');

    // Verificar se tem sourceMappingURL no final do arquivo
    const hasSourceMappingURL = content.includes('//# sourceMappingURL=') ||
                                  content.includes('//@ sourceMappingURL=');

    // Verificar se o arquivo .map correspondente existe
    const mapFile = jsFile + '.map';
    const mapExists = fs.existsSync(path.join(assetsPath, mapFile));

    if (hasSourceMappingURL && mapExists) {
      jsWithMapRef++;
    } else if (!hasSourceMappingURL && !mapExists) {
      // OK — sem source map e sem referência (ex: alguns chunks pequenos)
      jsWithoutMapRef++;
    } else if (hasSourceMappingURL && !mapExists) {
      missingRefs.push(jsFile);
    }
  }

  if (missingRefs.length > 0) {
    logError(`${missingRefs.length} arquivo(s) JS referenciam source maps que não existem:`);
    for (const f of missingRefs) {
      logError(`  - ${f}`);
    }
    return { valid: false, missingRefs };
  }

  logSuccess(`${jsWithMapRef} arquivo(s) JS com referência a source map`);
  if (jsWithoutMapRef > 0) {
    logInfo(`${jsWithoutMapRef} arquivo(s) JS sem source map (normal para chunks pequenos)`);
  }

  return { valid: true };
}

// ============================================================
// Main
// ============================================================

function main() {
  log('');
  log('╔══════════════════════════════════════════════════════════╗', 'bold');
  log('║     Source Maps Verification — Açaí Wave PDV            ║', 'bold');
  log('╚══════════════════════════════════════════════════════════╝', 'bold');
  log('');

  const startTime = Date.now();
  let exitCode = 0;

  // 1. Verificar se dist existe
  if (!checkDistExists()) {
    log('');
    logError('Falha na verificação: diretório de build não encontrado');
    process.exit(1);
  }

  // 2. Encontrar source maps
  const mapFiles = findSourceMaps();
  if (mapFiles.length === 0) {
    log('');
    if (strict) {
      logError('Falha: nenhum source map encontrado (modo --strict)');
      process.exit(1);
    } else {
      logWarning('Nenhum source map encontrado — continuando com outras verificações');
    }
  }

  // 3. Validar source maps
  if (mapFiles.length > 0) {
    const { allValid, results } = validateAllSourceMaps(mapFiles);
    if (!allValid) {
      exitCode = 1;
    }

    // 4. Verificar referências nos arquivos JS
    const refCheck = checkJSFilesReferenceSourceMaps();
    if (!refCheck.valid) {
      exitCode = 1;
    }
  }

  // 5. Verificar upload ao Sentry
  const sentryCheck = checkSentryUpload();

  // Resumo final
  logSection('Resumo');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (exitCode === 0) {
    logSuccess('Todas as verificações passaram');
  } else {
    logError('Algumas verificações falharam');
  }

  logInfo(`Tempo de verificação: ${duration}s`);

  if (sentryCheck.uploaded) {
    logSuccess('Source maps enviados ao Sentry');
  } else if (sentryCheck.reason === 'no_token') {
    logWarning('Source maps NÃO enviados ao Sentry (token não configurado)');
  } else {
    logWarning('Upload ao Sentry pode ter falhado');
  }

  log('');

  process.exit(exitCode);
}

main();
