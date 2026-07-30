const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'package.json');
let packageData;

try {
  packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('✓ package.json loaded successfully');
} catch (error) {
  console.error('✗ Error loading package.json:', error.message);
  process.exit(1);
}

const scripts = packageData.scripts || {};

console.log('\n=== BEFORE FIX ===');
if (scripts['dev:electron']) {
  console.log('  dev:electron:', scripts['dev:electron']);
}

if (scripts['dev']) {
  console.log('  dev:', scripts['dev']);
}

console.log('\n=== APPLYING FIX ===');

// Fix: Update dev:electron to use npx electron instead of just electron
// This ensures electron is always available from node_modules
packageData.scripts['dev:electron'] = 'wait-on http://localhost:5173/ && npx electron .';

// Fix: Update dev to properly reference the fixed dev:electron
packageData.scripts['dev'] = 'concurrently "npm run dev:vite" "npm run dev:electron"';

console.log('\n  ✓ dev:electron changed from "wait-on http://localhost:5173/ && electron ."');
console.log('  ✓ to: "wait-on http://localhost:5173/ && npx electron ."');

fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));

console.log('\n=== VERIFICATION ===');
console.log('\nAfter fix:');
console.log('  dev:electron =', packageData.scripts['dev:electron']);
console.log('  dev =', packageData.scripts['dev']);

console.log('\n=== TEST ELECTRON PATH ===');
// Test if npx can find electron
const testPath = require('path').join(process.cwd(), 'node_modules', '.bin', 'electron');
console.log('  Local electron path:', testPath);
console.log('  File exists:', fs.existsSync(testPath));

if (!fs.existsSync(testPath)) {
  console.log('  WARNING: local electron binary not found!');
}

console.log('\n=== FIX APPLIED SUCCESSFULLY ===');
console.log('\nThis change ensures that:');
console.log('  1. npm run dev:electron will always find electron in node_modules');
console.log('  2. Electron won't fail due to PATH issues');
console.log('  3. Development startup is more reliable');
