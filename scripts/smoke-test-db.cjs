#!/usr/bin/env node
const Database = require('better-sqlite3');
const { SqliteAdapter } = require('../database/adapters/sqlite.cjs');
const { MigrationEngine } = require('../database/migrate.cjs');
const path = require('path');
const fs = require('fs');

const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'acai-smoke-'));
const dbPath = path.join(tmpDir, 'smoke.db');
let db;
let exitCode = 0;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const adapter = new SqliteAdapter(db);
  const engine = new MigrationEngine(adapter, {
    migrationsDir: path.join(__dirname, '..', 'database', 'migrations'),
    lockDir: tmpDir,
    dryRun: false,
  });

  const result = engine.runMigrations();
  console.log(`Migration result: ${result.status} | version: ${result.currentVersion}`);

  if (result.status === 'success' || result.status === 'noop') {
    const tables = adapter.getTableList();
    console.log(`Tables (${tables.length}): ${tables.join(', ')}`);
    console.log('✅ Database smoke test PASSED');
  } else {
    console.error('❌ Migration failed:', JSON.stringify(result));
    exitCode = 1;
  }
} catch (e) {
  console.error('❌ Smoke test error:', e.message);
  if (e.stack) console.error(e.stack);
  exitCode = 1;
} finally {
  if (db) db.close();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  process.exit(exitCode);
}
