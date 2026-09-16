/**
 * Update Manager - gerencia auto-update com segurança para dados locais
 *
 * Funcionalidades:
 * 1. Verificação periódica de atualizações (em produção)
 * 2. Backup automático do banco de dados antes de atualizar
 * 3. Download em background com tracking de progresso
 * 4. Notificações ao usuário via IPC
 * 5. Reinicialização segura após update
 */

const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { getDbPath } = require('../database/db.cjs');
const logger = require('../database/logger.cjs').logger();

let isUpdateDownloaded = false;
let downloadProgress = null;

// Configurar logger — apenas se o transport file estiver disponível
if (logger && logger.transports && logger.transports.file) {
  autoUpdater.logger = logger;
  autoUpdater.logger.transports.file.level = 'info';
} else {
  // Fallback: logger mínimo que electron-updater aceita
  autoUpdater.logger = {
    info: (msg, meta) => console.log('[autoUpdater]', msg, meta || ''),
    warn: (msg, meta) => console.warn('[autoUpdater]', msg, meta || ''),
    error: (msg, meta) => console.error('[autoUpdater]', msg, meta || ''),
  };
}

// Configurar feed de atualização (GitHub Releases)
if (app.isPackaged) {
  autoUpdater.autoDownload = false; // Baixa manualmente
  autoUpdater.autoInstallOnAppQuit = true; // Instala ao fechar
}

/**
 * Notificar todos os webContents sobre evento de atualização
 */
function notifyRenderer(channel, data) {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
}

/**
 * Backup do banco de dados antes de atualizar
 */
function backupDatabase() {
  try {
    const dbPath = getDbPath();
    const backupDir = path.join(path.dirname(dbPath), 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `pre-update-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // Garantir que o diretório existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copiar o banco principal
    fs.copyFileSync(dbPath, backupPath);
    logger.info('[update] Backup criado:', backupPath);

    // Copiar WAL e SHM se existirem
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';

    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, backupPath + '-wal');
      logger.info('[update] Backup WAL criado');
    }
    if (fs.existsSync(shmPath)) {
      fs.copyFileSync(shmPath, backupPath + '-shm');
      logger.info('[update] Backup SHM criado');
    }

    return { success: true, backupPath };
  } catch (error) {
    logger.error('[update] Falha ao criar backup:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar integridade do banco de dados
 */
function verifyDatabaseIntegrity(db) {
  try {
    const result = db.prepare('PRAGMA integrity_check').get();
    return result.result === 'ok';
  } catch (error) {
    logger.error('[update] Erro na verificação de integridade:', error.message);
    return false;
  }
}

/**
 * Iniciar verificação de atualizações
 */
function checkForUpdates() {
  if (!app.isPackaged) {
    logger.info('[update] Desabilitado em desenvolvimento');
    return;
  }

  logger.info('[update] Verificando atualizações...');
  notifyRenderer('update:status-change', { status: 'checking' });

  autoUpdater.checkForUpdates()
    .then((result) => {
      logger.info('[update] Verificação concluída:', result?.updateInfo?.version || 'N/A');
    })
    .catch((error) => {
      logger.error('[update] Erro na verificação:', error.message);
      notifyRenderer('update:error', { message: error.message });
      notifyRenderer('update:status-change', { status: 'error' });
    });
}

/**
 * Baixar atualização (chamado pelo renderer)
 */
async function downloadUpdate() {
  if (!app.isPackaged) {
    return { success: false, error: 'Desabilitado em desenvolvimento' };
  }

  if (isUpdateDownloaded) {
    return { success: true, message: 'Atualização já está pronta para instalar' };
  }

  try {
    logger.info('[update] Iniciando download...');
    notifyRenderer('update:status-change', { status: 'downloading' });
    await autoUpdater.downloadUpdate();
    return { success: true, message: 'Download concluído' };
  } catch (error) {
    logger.error('[update] Falha no download:', error.message);
    notifyRenderer('update:error', { message: error.message });
    notifyRenderer('update:status-change', { status: 'error' });
    return { success: false, error: error.message };
  }
}

/**
 * Instalar atualização (reiniciar app)
 */
function installUpdate() {
  if (!app.isPackaged) {
    return;
  }

  // Backup antes de reinstalar
  const backup = backupDatabase();

  if (!backup.success) {
    logger.error('[update] Não foi possível criar backup. Cancelando instalação.');
    notifyRenderer('update:error', { message: 'Falha ao criar backup: ' + backup.error });
    return;
  }

  logger.info('[update] Instalando atualização...');
  isUpdateDownloaded = false;
  autoUpdater.quitAndInstall(true, true);
}

/**
 * Configurar listeners de eventos do autoUpdater
 */
function setupUpdateListeners() {
  if (!app.isPackaged) return;

  autoUpdater.on('checking-for-update', () => {
    logger.info('[update] Verificando atualizações...');
    notifyRenderer('update:status-change', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    logger.info('[update] Atualização disponível:', info.version);
    notifyRenderer('update:available', info);
    notifyRenderer('update:status-change', { status: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    logger.info('[update] Já está na última versão');
    notifyRenderer('update:status-change', { status: 'latest' });
  });

  autoUpdater.on('download-progress', (progress) => {
    downloadProgress = progress;
    logger.info(`[update] Progresso: ${progress.percent}%`);
    notifyRenderer('update:downloading', { percent: progress.percent });
    notifyRenderer('update:status-change', { status: 'downloading', percent: progress.percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    isUpdateDownloaded = true;
    logger.info('[update] Download concluído:', info.version);
    notifyRenderer('update:downloaded', info);
    notifyRenderer('update:status-change', { status: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (error) => {
    logger.error('[update] Erro:', error.message);
    notifyRenderer('update:error', { message: error.message });
    notifyRenderer('update:status-change', { status: 'error' });
  });
}

/**
 * Configurar handlers IPC para o renderer
 */
function setupIPCHandlers() {
  // Verificar atualizações (renderer pode solicitar)
  ipcMain.handle('update:check', async () => {
    checkForUpdates();
    return { success: true };
  });

  // Iniciar download
  ipcMain.handle('update:download', async () => {
    return await downloadUpdate();
  });

  // Instalar atualização
  ipcMain.handle('update:install', async () => {
    installUpdate();
    return { success: true };
  });
}

// Inicializar
setupUpdateListeners();
setupIPCHandlers();

// Verificar automaticamente ao iniciar (com delay para não bloquear startup)
if (app.isPackaged) {
  setTimeout(() => {
    checkForUpdates();
  }, 5000);

  // Verificar a cada hora
  setInterval(() => {
    checkForUpdates();
  }, 60 * 60 * 1000);
}

module.exports = {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  backupDatabase,
  verifyDatabaseIntegrity,
};
