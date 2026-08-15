#!/usr/bin/env node
/**
 * Gera todos os ícones da aplicação a partir do ICO base fornecido pelo
 * usuário (build/acai256x256.ico). Saídas:
 *   - build/icon.ico            (Windows app icon, multi-res 16-256)
 *   - build/icon.icns           (macOS app icon, iconset)
 *   - build/icon.png            (Linux app icon, 512x512)
 *   - build/installer-icon.ico  (NSIS installer/uninstaller icon)
 *
 * Uso: node scripts/generate-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { decode } = require('ico-endec');
const png2icons = require('png2icons');

const buildDir = path.join(__dirname, '..', 'build');
const srcIco = path.join(buildDir, 'acai256x256.ico');

function fail(msg) {
  console.error(`[generate-icons] ERRO: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(srcIco)) {
  fail(`Fonte não encontrada: ${srcIco}\n      Coloque o arquivo acai256x256.ico em build/`);
}

// 1. Extrair o maior PNG do ICO base
const decoded = decode(fs.readFileSync(srcIco));
let best = null;
for (const key of Object.keys(decoded)) {
  const img = decoded[key];
  if (!best || img._width > best._width) best = img;
}
if (!best || !best._imageData) {
  fail('Não foi possível extrair PNG do ICO base.');
}
const basePng = best._imageData;
console.log(`[generate-icons] PNG base extraído: ${best._width}x${best._height}`);

// 2. icon.ico — multi-resolução via png2icons (16,24,32,48,64,72,96,128,256)
const ico = png2icons.createICO(basePng, png2icons.BILINEAR, 0);
if (!ico) fail('Falha ao gerar icon.ico');
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
console.log('[generate-icons] OK  build/icon.ico');

// 3. icon.icns — macOS via png2icons
const icns = png2icons.createICNS(basePng, png2icons.BILINEAR, 0);
if (!icns) fail('Falha ao gerar icon.icns');
fs.writeFileSync(path.join(buildDir, 'icon.icns'), icns);
console.log('[generate-icons] OK  build/icon.icns');

// 4. icon.png — Linux 512x512 (upscale do PNG base)
sharp(basePng)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toBuffer()
  .then((png512) => {
    fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);
    console.log('[generate-icons] OK  build/icon.png (512x512)');

    // 5. installer-icon.ico — cópia do icon.ico
    fs.copyFileSync(path.join(buildDir, 'icon.ico'), path.join(buildDir, 'installer-icon.ico'));
    console.log('[generate-icons] OK  build/installer-icon.ico');

    console.log('\n[generate-icons] Todos os ícones gerados com sucesso em build/');
  })
  .catch((e) => fail(`Falha ao gerar icon.png: ${e.message}`));