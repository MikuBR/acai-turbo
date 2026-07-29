const path = require('path');
const fs = require('fs');

class MigrationError extends Error {
  constructor(message, { version, stage, backupPath, cause } = {}) {
    super(message);
    this.name = 'MigrationError';
    this.version = version;
    this.stage = stage;
    this.backupPath = backupPath;
    this.cause = cause;
  }
}

class MigrationEngine {
  constructor(adapter, options = {}) {
    if (!adapter) throw new Error('MigrationEngine requires an adapter');
    this.adapter = adapter;
    this.migrationsDir = options.migrationsDir || path.join(__dirname, 'migrations');
    this.backupDir = options.backupDir;
    this.lockDir = options.lockDir;
    this.dryRun = options.dryRun === true;
    this._migrations = null;
    this.lockFile = this.lockDir ? path.join(this.lockDir, 'migrate.lock') : null;
  }

  _loadMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => /^\d+-.+\.cjs$/.test(f))
      .sort();

    const migrations = [];
    for (const file of files) {
      const mod = require(path.join(this.migrationsDir, file));
      const version = parseInt(file.match(/^(\d+)/)[1], 10);
      migrations.push({
        version,
        file,
        description: mod.description || file,
        up: mod.up,
        down: mod.down || null,
        validate: mod.validate || null,
        preValidate: mod.preValidate || null,
        dependencies: mod.dependencies || [],
      });
    }
    return migrations;
  }

  _ensureMigrationsTable() {
    if (this._migrations) return;
    this.adapter.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        checksum TEXT,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'success',
        error TEXT
      )
    `);
    this._migrations = true;
  }

  _acquireLock() {
    if (!this.lockFile) return true;
    try {
      if (fs.existsSync(this.lockFile)) {
        const content = fs.readFileSync(this.lockFile, 'utf-8');
        try {
          const data = JSON.parse(content);
          if (data.pid === process.pid) return true;
          fs.unlinkSync(this.lockFile);
        } catch {
          fs.unlinkSync(this.lockFile);
        }
      }
      const lockData = JSON.stringify({
        pid: process.pid,
        startedAt: new Date().toISOString(),
        hostname: require('os').hostname(),
      });
      fs.writeFileSync(this.lockFile, lockData, 'utf-8');
      return true;
    } catch (e) {
      if (e instanceof MigrationError) throw e;
      throw new MigrationError(
        `Falha ao adquirir lock de migração: ${e.message}`,
        { stage: 'lock', cause: e }
      );
    }
  }

  _releaseLock() {
    if (!this.lockFile) return;
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
      }
    } catch {
    }
  }

  getCurrentVersion() {
    this._ensureMigrationsTable();
    const row = this.adapter.queryOne(
      "SELECT COALESCE(MAX(version), 0) as version FROM _migrations WHERE status = 'success'"
    );
    return row?.version || 0;
  }

  getMigrationHistory() {
    this._ensureMigrationsTable();
    return this.adapter.query(
      'SELECT * FROM _migrations ORDER BY version ASC'
    );
  }

  getPendingMigrations() {
    const currentVersion = this.getCurrentVersion();
    const allMigrations = this._loadMigrationFiles();
    return allMigrations.filter(m => m.version > currentVersion);
  }

  runMigrations() {
    const pending = this.getPendingMigrations();
    if (pending.length === 0) {
      return { status: 'noop', currentVersion: this.getCurrentVersion() };
    }

    this._acquireLock();

    let backupPath = null;
    const applied = [];

    try {
      if (this.backupDir) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      for (const migration of pending) {
        console.log(`[migrate] Running migration v${migration.version}: ${migration.description}`);

        const startTime = Date.now();

        if (migration.dependencies && migration.dependencies.length > 0) {
          const currentVersion = this.getCurrentVersion();
          for (const dep of migration.dependencies) {
            if (dep > currentVersion) {
              throw new MigrationError(
                `Migration v${migration.version} depende da v${dep}, que ainda não foi aplicada`,
                { version: migration.version, stage: 'dependency' }
              );
            }
          }
        }

        if (migration.preValidate) {
          try {
            migration.preValidate(this.adapter);
          } catch (e) {
            throw new MigrationError(
              `Falha na pré-validação v${migration.version}: ${e.message}`,
              { version: migration.version, stage: 'pre-validate', cause: e }
            );
          }
        }

        if (!backupPath && this.backupDir) {
          try {
            backupPath = this.adapter.backup();
            if (backupPath) {
              console.log(`[migrate] Backup created: ${backupPath}`);
            }
          } catch (e) {
            console.warn(`[migrate] Backup não-fatal falhou: ${e.message}`);
            backupPath = null;
          }
        }

        if (this.dryRun) {
          console.log(`[migrate] Dry-run mode: simulating migration v${migration.version}`);
          continue;
        }

        try {
          this.adapter.transaction(() => {
            migration.up(this.adapter);

            if (migration.validate) {
              migration.validate(this.adapter);
            }

            const elapsed = Date.now() - startTime;

            let checksum = null;
            try {
              checksum = this.adapter.checksum();
            } catch {
            }

            this.adapter.run(
              `INSERT INTO _migrations (version, description, checksum, duration_ms, status)
               VALUES (?, ?, ?, ?, 'success')`,
              [migration.version, migration.description, checksum, elapsed]
            );
          });
        } catch (e) {
          const elapsed = Date.now() - startTime;
          try {
            this.adapter.run(
              `INSERT INTO _migrations (version, description, duration_ms, status, error)
               VALUES (?, ?, ?, 'failed', ?)`,
              [migration.version, migration.description, elapsed, e.message]
            );
          } catch {
          }

          if (backupPath) {
            try {
              this.adapter.restore(backupPath);
              console.log(`[migrate] Database restored from backup: ${backupPath}`);
            } catch (restoreError) {
              throw new MigrationError(
                `Falha na migration v${migration.version} E falha no restore do backup: ${restoreError.message}. Backup manual em: ${backupPath}`,
                { version: migration.version, stage: 'rollback', backupPath, cause: e }
              );
            }
          }

          throw new MigrationError(
            `Falha na migration v${migration.version}: ${e.message}`,
            { version: migration.version, stage: 'migrate', backupPath, cause: e }
          );
        }

        const elapsed = Date.now() - startTime;
        console.log(`[migrate] v${migration.version} applied in ${elapsed}ms`);
        applied.push(migration.version);
      }

      this._releaseLock();

      return {
        status: 'success',
        applied,
        currentVersion: this.getCurrentVersion(),
        backupPath,
      };
    } catch (e) {
      this._releaseLock();
      throw e;
    }
  }
}

module.exports = { MigrationEngine, MigrationError };
