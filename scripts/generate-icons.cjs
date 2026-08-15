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

/**
 * Obtém o PNG base: extrai o maior PNG do ICO fornecido pelo usuário.
 * Se o ICO não existir (ex: runner limpo do CI — build/ é gitignored),
 * gera um placeholder seguro (fundo roxo + "AW") para não quebrar o build.
 */
async function getBasePng() {
  if (fs.existsSync(srcIco)) {
    const decoded = decode(fs.readFileSync(srcIco));
    let best = null;
    for (const key of Object.keys(decoded)) {
      const img = decoded[key];
      if (!best || img._width > best._width) best = img;
    }
    if (!best || !best._imageData) {
      fail('Não foi possível extrair PNG do ICO base.');
    }
    console.log(`[generate-icons] PNG base extraído do ICO: ${best._width}x${best._height}`);
    return best._imageData;
  }

  console.warn(`[generate-icons] AVISO: ${srcIco} não encontrado.`);
  console.warn('[generate-icons] Gerando ícone placeholder — o instalador do CI ficará genérico.');
  console.warn('[generate-icons] Para o ícone oficial, coloque acai256x256.ico em build/ (local) e rode prepare:assets.');
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
      '<rect width="256" height="256" fill="#863BFF"/>' +
      '<circle cx="128" cy="112" r="50" fill="#ffffff" opacity="0.95"/>' +
      '<text x="128" y="196" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="#ffffff">AW</text>' +
      '</svg>'
  );
  return sharp(svg).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const basePng = await getBasePng();

  // 1. icon.ico — multi-resolução via png2icons (16,24,32,48,64,72,96,128,256)
  const ico = png2icons.createICO(basePng, png2icons.BILINEAR, 0);
  if (!ico) fail('Falha ao gerar icon.ico');
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
  console.log('[generate-icons] OK  build/icon.ico');

  // 2. icon.icns — macOS via png2icons
  const icns = png2icons.createICNS(basePng, png2icons.BILINEAR, 0);
  if (!icns) fail('Falha ao gerar icon.icns');
  fs.writeFileSync(path.join(buildDir, 'icon.icns'), icns);
  console.log('[generate-icons] OK  build/icon.icns');

  // 3. icon.png — Linux 512x512 (upscale do PNG base)
  const png512 = await sharp(basePng)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);
  console.log('[generate-icons] OK  build/icon.png (512x512)');

  // 4. installer-icon.ico — cópia do icon.ico
  fs.copyFileSync(path.join(buildDir, 'icon.ico'), path.join(buildDir, 'installer-icon.ico'));
  console.log('[generate-icons] OK  build/installer-icon.ico');

  console.log('\n[generate-icons] Todos os ícones gerados com sucesso em build/');
}

main().catch((e) => fail(e.message));