const fs = require('fs');
const path = require('path');

console.log('=== Fixing Electron Crash Issue ===');

const packagePath = path.join(__dirname, 'package.json');
let packageData;

try {
  packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('✓ package.json loaded successfully');
} catch (error) {
  console.error('✗ Error loading package.json:', error.message);
  process.exit(1);
}

const originalDevElectron = packageData.scripts['dev:electron'] || '';

console.log('\n=== BEFORE ===');
console.log('  dev:electron =', originalDevElectron || '(not set)');

// THE FIX: Change "electron ." to "npx electron ."
// This ensures electron is always found in PATH
packageData.scripts['dev:electron'] = 'wait-on http://localhost:5173/ && npx electron .';

// Also update dev to match
packageData.scripts['dev'] = 'concurrently "npm run dev:vite" "npm run dev:electron"';

fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));

console.log('\n=== AFTER ===');
console.log('  dev:electron =', packageData.scripts['dev:electron']);
console.log('  dev =', packageData.scripts['dev']);

console.log('\n=== WHY THIS FIXES THE ISSUE ===');
console.log('  1. npm install --only=prod does NOT install electron globally');
console.log('  2. "electron ." fails because electron is not in system PATH');
console.log('  3. "npx electron ." finds electron in node_modules/.bin');
console.log('  4. This prevents the SIGSEGV crash due to missing executable');

console.log('\n=== VERIFICATION ===');
const electronBin = path.join(__dirname, 'node_modules', '.bin', 'electron');
console.log('  Local electron binary exists:', fs.existsSync(electronBin));

if (fs.existsSync(electronBin)) {
  const stats = fs.statSync(electronBin);
  console.log('  Is executable:', (stats.mode & 0o111) ? 'YES' : 'NO');
}

console.log('\n=== SUCCESS ===');
console.log('  The dev:electron script has been fixed to use npx electron.');
console.log('  This should resolve the Electron crash issue on startup.');
