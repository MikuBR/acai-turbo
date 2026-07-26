const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const BACKEND_FILES = [
  'main.cjs',
  'preload.js',
  'database/db.cjs',
  'database/validate.cjs',
];

const originalContents = {};

function obfuscateBackend() {
  console.log('\n[build] Obfuscating backend files...\n');
  const JavaScriptObfuscator = require('javascript-obfuscator');

  const options = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    rotateStringArray: true,
    selfDefending: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    renameGlobals: false,
    renameProperties: false,
    identifierNamesGenerator: 'hexadecimal',
  };

  for (const file of BACKEND_FILES) {
    const filePath = path.join(ROOT, file);
    const code = fs.readFileSync(filePath, 'utf8');
    originalContents[file] = code;

    console.log(`  -> ${file}`);
    const result = JavaScriptObfuscator.obfuscate(code, options);
    fs.writeFileSync(filePath, result.getObfuscatedCode());
  }
}

function restoreOriginals() {
  console.log('\n[build] Restoring original backend files...');
  for (const file of BACKEND_FILES) {
    if (originalContents[file]) {
      fs.writeFileSync(path.join(ROOT, file), originalContents[file]);
      console.log(`  -> ${file} restored`);
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error(`\n[build] UNCAUGHT: ${err.message}`);
  restoreOriginals();
  process.exit(1);
});

try {
  console.log('[build] Starting production build...\n');

  // Step 1: Vite build (frontend)
  console.log('[build] 1/3 - Building frontend...');
  execSync('npx vite build', { stdio: 'inherit', cwd: ROOT });
  console.log('[build] Frontend built.\n');

  // Step 2: Obfuscate backend files
  console.log('[build] 2/3 - Obfuscating backend...');
  obfuscateBackend();
  console.log('[build] Backend obfuscated.\n');

  // Step 3: Package with electron-builder
  console.log('[build] 3/3 - Packaging with electron-builder...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit', cwd: ROOT });

  console.log('\n[build] Production build completed successfully!');
} catch (error) {
  console.error(`\n[build] Build failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  restoreOriginals();
}
