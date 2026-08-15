#!/usr/bin/env node
/**
 * Gera o cabeçalho do instalador NSIS (150x57 BMP) a partir do ícone base.
 * O sharp desta versão não compila BMP, então o BMP é escrito manualmente
 * (BITMAPFILEHEADER + BITMAPINFOHEADER + pixels BGR bottom-up, 24bpp).
 * Saída:
 *   - build/installer-header.bmp  (150x57, fundo roxo #863BFF + logo branco)
 *
 * Uso: node scripts/generate-installer-header.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { decode } = require('ico-endec');

const buildDir = path.join(__dirname, '..', 'build');
const srcIco = path.join(buildDir, 'acai256x256.ico');

function fail(msg) {
  console.error(`[generate-header] ERRO: ${msg}`);
  process.exit(1);
}

/**
 * Obtém o PNG base: extrai o maior PNG do ICO fornecido pelo usuário.
 * Se o ICO não existir (ex: runner limpo do CI — build/ é gitignored),
 * retorna null e o header é gerado apenas com o fundo (sem logo).
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
    console.log(`[generate-header] PNG base extraído do ICO: ${best._width}x${best._height}`);
    return best._imageData;
  }

  console.warn(`[generate-header] AVISO: ${srcIco} não encontrado.`);
  console.warn('[generate-header] Header gerado sem logo (apenas fundo) — seguro para o CI.');
  return null;
}

// 2. Logo branco (36x36) — forçar branco mantendo o alpha original
async function makeWhiteLogo(png) {
  const { data, info } = await sharp(png)
    .resize(36, 36, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = 255;         // R
    out[i + 1] = 255;     // G
    out[i + 2] = 255;     // B
    out[i + 3] = data[i + 3]; // A original
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

// 3. Compor canvas 150x57 roxo + logo centralizado (se houver), e obter RGBA final
async function composeCanvas(whiteLogo) {
  let pipeline = sharp({
    create: {
      width: 150,
      height: 57,
      channels: 4,
      background: { r: 134, g: 59, b: 255, alpha: 1 }, // #863BFF
    },
  });
  if (whiteLogo) {
    pipeline = pipeline.composite([{ input: whiteLogo, gravity: 'center' }]);
  }
  const { data, info } = await pipeline
    .removeAlpha() // 24bpp para o BMP (sem canal alpha)
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height }; // RGB
}

// 4. Escrever BMP 24bpp (BGR, bottom-up, cada linha padded a múltiplo de 4)
function writeBmp(filePath, { data, width, height }) {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // padding
  const pixelDataSize = rowSize * height;
  const fileSize = 14 + 40 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0, 2, 'ascii');
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6); // reserved
  buf.writeUInt32LE(14 + 40, 10); // pixel data offset

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14); // header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26); // planes
  buf.writeUInt16LE(24, 28); // bpp
  buf.writeUInt32LE(0, 30); // compression (BI_RGB)
  buf.writeUInt32LE(pixelDataSize, 34);
  buf.writeInt32LE(2835, 38); // X ppm (~72dpi)
  buf.writeInt32LE(2835, 42); // Y ppm
  buf.writeUInt32LE(0, 46); // colors used
  buf.writeUInt32LE(0, 50); // important colors

  // Pixels (bottom-up, BGR)
  let offset = 14 + 40;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3; // RGB
      buf[offset] = data[src + 2];     // B
      buf[offset + 1] = data[src + 1]; // G
      buf[offset + 2] = data[src];     // R
      offset += 3;
    }
    offset += rowSize - width * 3; // padding
  }

  fs.writeFileSync(filePath, buf);
}

(async () => {
  try {
    const basePng = await getBasePng();
    const whiteLogo = basePng ? await makeWhiteLogo(basePng) : null;
    const canvas = await composeCanvas(whiteLogo);
    writeBmp(path.join(buildDir, 'installer-header.bmp'), canvas);
    console.log(`[generate-header] OK  build/installer-header.bmp (${canvas.width}x${canvas.height})`);
  } catch (e) {
    fail(e.message);
  }
})();