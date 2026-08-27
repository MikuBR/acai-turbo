#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => /^\d+-.+\.cjs$/.test(f))
  .sort();

const versions = [];
const duplicates = [];

for (const file of files) {
  const match = file.match(/^(\d+)-/);
  if (match) {
    const version = parseInt(match[1], 10);
    if (versions.includes(version)) {
      duplicates.push({ file, version });
    } else {
      versions.push(version);
    }
  }
}

if (duplicates.length > 0) {
  console.error('❌ Duplicate migration versions detected:');
  duplicates.forEach(d => {
    console.error(`   v${d.version}: ${d.file}`);
  });
  console.error('\nEach migration must have a unique version number.');
  process.exit(1);
}

// Also check for gaps in sequence (optional warning)
const sorted = [...versions].sort((a, b) => a - b);
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i] - sorted[i-1] > 1) {
    console.warn(`⚠️  Version gap detected: v${sorted[i-1]} -> v${sorted[i]}`);
  }
}

console.log(`✅ Migration versions unique: ${versions.length} migrations (v${Math.min(...versions)} - v${Math.max(...versions)})`);
process.exit(0);
