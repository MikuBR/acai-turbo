const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class SqliteAdapter {
  constructor(db, backupDir) {
    if (!db || typeof db.prepare !== 'function') {
      throw new Error('SqliteAdapter requires a valid better-sqlite3 instance');
    }
    this.db = db;
    this.backupDir = backupDir;
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
    const dbPath = this.db.name;
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      if (fs.existsSync(dbPath + '-wal')) {
        fs.copyFileSync(dbPath + '-wal', backupPath + '-wal');
      }
      if (fs.existsSync(dbPath + '-shm')) {
        fs.copyFileSync(dbPath + '-shm', backupPath + '-shm');
      }
    }
    return backupPath;
  }

  restore(backupPath) {
    if (!backupPath || !fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }
    this.db.close();
    const dbPath = this.db.name;
    fs.copyFileSync(backupPath, dbPath);
    const walPath = backupPath + '-wal';
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, dbPath + '-wal');
    }
    return dbPath;
  }

  close() {
    this.db.close();
  }
}

module.exports = { SqliteAdapter };
