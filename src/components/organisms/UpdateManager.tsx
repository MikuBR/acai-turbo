import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Download, XCircle, RefreshCw } from 'lucide-react'
import { setStoredReleaseNotes } from '../../services/versionStorage'

interface UpdateInfo {
  version: string
  releaseNotes?: string
}

interface UpdateManagerProps {
  // No props needed - uses window.electron directly
}

/**
 * UpdateManager - Componente de gerenciamento de atualizações
 * 
 * Exibe:
 * - Banner de atualização disponível
 * - Modal de download em progresso
 * - Notificação de atualização pronta
 */
export function UpdateManager(_props: UpdateManagerProps) {
  const [updateStatus, setUpdateStatus] = useState<string>('idle'); // idle, checking, available, downloading, downloaded, error, latest
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Auto-fechar notificações (available/error) em no máximo 5s
  useEffect(() => {
    if (updateStatus === 'available' || updateStatus === 'error' || updateStatus === 'latest') {
      const t = setTimeout(() => setUpdateStatus('idle'), 5000);
      return () => clearTimeout(t);
    }
  }, [updateStatus]);

  useEffect(() => {
    const electron = (window as any).electron;
    if (!electron) return;

    const unsubStatusChange = electron.ipcRenderer.on('update:status-change', (event: any, info: any) => {
      if (!info) return;
      setUpdateStatus(info.status || 'idle');
      if (info.version) setUpdateInfo({ ...updateInfo, version: info.version });
      if (typeof info.percent === 'number') setDownloadProgress(info.percent);
    });

    const unsubAvailable = electron.ipcRenderer.on('update:available', (event: any, info: any) => {
      setUpdateStatus('available');
      setUpdateInfo(info);
    });

    const unsubDownloading = electron.ipcRenderer.on('update:downloading', (event: any, progress: any) => {
      setUpdateStatus('downloading');
      setDownloadProgress(progress?.percent || 0);
    });

    const unsubDownloaded = electron.ipcRenderer.on('update:downloaded', (event: any, info: any) => {
      setUpdateStatus('downloaded');
      setUpdateInfo(info);
      if (info?.releaseNotes) setStoredReleaseNotes(typeof info.releaseNotes === 'string' ? info.releaseNotes : JSON.stringify(info.releaseNotes));
    });

    const unsubError = electron.ipcRenderer.on('update:error', (event: any, err: any) => {
      setUpdateStatus('error');
      setError(err?.message || 'Erro desconhecido');
    });

    return () => {
      unsubStatusChange();
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
      const result = await (window as any).electron.ipcRenderer.invoke('update:check');
      if (!result.success) {
        setError(result.error);
        setUpdateStatus('error');
      }
    } catch (err: any) {
      setError(err.message);
      setUpdateStatus('error');
    }
  };

  const handleDownloadUpdate = async () => {
    setUpdateStatus('downloading');
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('update:download');
      if (!result.success) {
        setError(result.error);
        setUpdateStatus('error');
      }
    } catch (err: any) {
      setError(err.message);
      setUpdateStatus('error');
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await (window as any).electron.ipcRenderer.invoke('update:install');
    } catch (err: any) {
      setError(err.message);
      setUpdateStatus('error');
    }
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

  if (updateStatus === 'latest') {
    return (
      <button
        onClick={handleCheckForUpdates}
        className="fixed top-4 right-4 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl transition-all z-[9999]"
        title="Verificar atualizações"
      >
        <RefreshCw size={20} />
      </button>
    );
  }

  if (updateStatus === 'error') {
    return (
      <div className="fixed top-4 right-4 max-w-sm bg-red-600 text-white p-4 rounded-lg shadow-2xl z-[9999] border border-white/20">
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
          className="mt-3 w-full py-2 bg-white/90 hover:bg-white text-red-600 rounded text-sm font-medium transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (updateStatus === 'available') {
    return (
      <div className="fixed top-4 right-4 max-w-sm bg-orange-500 text-white p-4 rounded-lg shadow-2xl z-[9999] border border-white/20">
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
          className="mt-3 w-full py-2 bg-white text-orange-600 hover:bg-surface-light rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Baixar agora
        </button>
      </div>
    );
  }

  if (updateStatus === 'downloading') {
    return (
      <div className="fixed top-4 right-4 max-w-sm bg-orange-500 text-white p-4 rounded-lg shadow-2xl z-[9999] border border-white/20">
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

  if (updateStatus === 'downloaded') {
    return (
      <div className="fixed top-4 right-4 max-w-sm bg-green-600 text-white p-4 rounded-lg shadow-2xl z-[9999] border border-white/20">
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
            className="flex-1 py-2 bg-white text-success hover:bg-surface-light rounded text-sm font-medium transition-colors"
          >
            Reiniciar e instalar
          </button>
          <button
            onClick={() => setUpdateStatus('idle')}
            className="px-3 py-2 bg-white/90 hover:bg-white/100 text-green-600 rounded text-sm font-medium transition-colors"
          >
            Depois
          </button>
        </div>
      </div>
    );
  }

  return null;
}
