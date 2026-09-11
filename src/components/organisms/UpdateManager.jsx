import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Download, XCircle, RefreshCw } from 'lucide-react';

/**
 * UpdateManager - Componente de gerenciamento de atualizações
 * 
 * Exibe:
 * - Banner de atualização disponível
 * - Modal de download em progresso
 * - Notificação de atualização pronta
 */
export function UpdateManager() {
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, downloaded, error, latest
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const electron = window.electron;
    if (!electron) return;

    // Escutar eventos do main process
    const unsubAvailable = electron.ipcRenderer.on('update:available', (event, info) => {
      setUpdateStatus('available');
      setUpdateInfo(info);
    });

    const unsubDownloading = electron.ipcRenderer.on('update:downloading', (event, progress) => {
      setUpdateStatus('downloading');
      setDownloadProgress(progress.percent || 0);
    });

    const unsubDownloaded = electron.ipcRenderer.on('update:downloaded', (event, info) => {
      setUpdateStatus('downloaded');
      setUpdateInfo(info);
    });

    const unsubError = electron.ipcRenderer.on('update:error', (event, err) => {
      setUpdateStatus('error');
      setError(err?.message || 'Erro desconhecido');
    });

    return () => {
      unsubAvailable();
      unsubDownloading();
      unsubDownloaded();
      unsubError();
    };
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking');
    setError(null);
    try {
      const result = await window.electron.ipcRenderer.invoke('update:check');
      if (!result.success) {
        setError(result.error);
        setUpdateStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setUpdateStatus('error');
    }
  };

  const handleDownloadUpdate = async () => {
    setUpdateStatus('downloading');
    try {
      const result = await window.electron.ipcRenderer.invoke('update:download');
      if (!result.success) {
        setError(result.error);
        setUpdateStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setUpdateStatus('error');
    }
  };

  const handleInstallUpdate = async () => {
    await window.electron.ipcRenderer.invoke('update:install');
  };

  const handleClose = () => {
    if (updateStatus !== 'downloaded') {
      setUpdateStatus('idle');
    }
    setError(null);
  };

  if (updateStatus === 'idle' || updateStatus === 'checking') {
    return null;
  }

  // Botão flutuante para verificar atualizações manualmente
  if (updateStatus === 'latest') {
    return (
      <button
        onClick={handleCheckForUpdates}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all z-50"
        title="Verificar atualizações"
      >
        <RefreshCw size={20} />
      </button>
    );
  }

  // Notificação de erro
  if (updateStatus === 'error') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-start gap-3">
          <XCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Erro na atualização</p>
            <p className="text-sm opacity-90 mt-1">{error}</p>
          </div>
          <button onClick={handleClose} className="ml-2 hover:opacity-80">
            <XCircle size={18} />
          </button>
        </div>
        <button
          onClick={handleCheckForUpdates}
          className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Banner de atualização disponível (não baixada)
  if (updateStatus === 'available') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Nova versão disponível!</p>
            {updateInfo && (
              <p className="text-sm opacity-90 mt-1">
                Versão {updateInfo.version}
                {updateInfo.releaseNotes && <span className="ml-2">({updateInfo.releaseNotes.length} notas)</span>}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="ml-2 hover:opacity-80">
            <XCircle size={18} />
          </button>
        </div>
        <button
          onClick={handleDownloadUpdate}
          className="mt-3 w-full py-2 bg-white text-purple-600 hover:bg-purple-50 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Baixar agora
        </button>
      </div>
    );
  }

  // Download em progresso
  if (updateStatus === 'downloading') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-3">
          <Download size={20} className="animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold">Baixando atualização...</p>
            <p className="text-sm opacity-90 mt-1">{Math.round(downloadProgress)}% concluído</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // Download concluído - pronto para instalar
  if (updateStatus === 'downloaded') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Atualização pronta!</p>
            <p className="text-sm opacity-90 mt-1">
              Versão {updateInfo?.version} foi baixada com sucesso.
            </p>
          </div>
          <button onClick={() => setUpdateStatus('idle')} className="ml-2 hover:opacity-80">
            <XCircle size={18} />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstallUpdate}
            className="flex-1 py-2 bg-white text-green-600 hover:bg-green-50 rounded text-sm font-medium transition-colors"
          >
            Reiniciar e instalar
          </button>
          <button
            onClick={() => setUpdateStatus('idle')}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
          >
            Depois
          </button>
        </div>
      </div>
    );
  }

  return null;
}
