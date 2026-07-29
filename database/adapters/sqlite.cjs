const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const Database = require('better-sqlite3');

class SqliteAdapter {
  constructor(db, backupDir) {
    if (!db || typeof db.prepare !== 'function') {
      throw new Error('SqliteAdapter requires a valid better-sqlite3 instance');
    }
    this.db = db;
    this.backupDir = backupDir;
  }

  getDbPath() {
    return this.db.name;
  }

  query(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  queryOne(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(...params);
  }

  transaction(fn) {
    const tx = this.db.transaction(fn);
    return tx();
  }

  tableExists(name) {
    const row = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
    ).get(name);
    return !!row;
  }

  columnExists(table, column) {
    const columns = this.getTableColumns(table);
    return columns.some(c => c.name === column);
  }

  getTableList() {
    return this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_migrations' ORDER BY name"
    ).all().map(r => r.name);
  }

  getTableColumns(table) {
    return this.db.prepare(`PRAGMA table_info(${table})`).all();
  }

  getTableSchema(table) {
    const row = this.db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?"
    ).get(table);
    return row ? row.sql : null;
  }

  getIndexes(table) {
    return this.db.prepare(`PRAGMA index_list(${table})`).all();
  }

  checksum() {
    const tables = this.getTableList();
    const hash = crypto.createHash('sha256');
    for (const table of tables) {
      const rows = this.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
      hash.update(table);
      hash.update(JSON.stringify(rows));
    }
    return hash.digest('hex');
  }

  backup() {
    if (!this.backupDir) return null;
    fs.mkdirSync(this.backupDir, { recursive: true });
    const backupPath = path.join(
      this.backupDir,
      `acai_turbo_v4.db.${Date.now()}.bak`
    );
    const dbPath = this.getDbPath();
    if (!fs.existsSync(dbPath)) return null;

    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        fs.copyFileSync(dbPath, backupPath);
        return backupPath;
      } catch (err) {
        lastErr = err;
        if (attempt < 2) {
          const waitMs = 200 * (attempt + 1);
          const start = Date.now();
          while (Date.now() - start < waitMs);
        }
      }
    }
    console.warn(`[sqlite] Backup não-fatal falhou após 3 tentativas: ${lastErr.message}`);
    return null;
  }

  restore(backupPath) {
    if (!backupPath || !fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }
    const dbPath = this.getDbPath();
    this.db.close();
    fs.copyFileSync(backupPath, dbPath);
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    return dbPath;
  }

  close() {
    this.db.close();
  }
}

module.exports = { SqliteAdapter };
