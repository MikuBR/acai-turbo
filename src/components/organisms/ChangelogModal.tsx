import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getLastSeenVersion, setLastSeenVersion, getStoredReleaseNotes, getCurrentVersion } from '../../services/versionStorage';

function sanitizeHtml(html: string): string {
  // Remove scripts, iframes, event handlers e tags perigosas
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export default function ChangelogModal() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const current = getCurrentVersion();
    const last = getLastSeenVersion();
    if (last && last !== current) {
      setVersion(current);
      setNotes(getStoredReleaseNotes());
      setOpen(true);
    } else if (!last) {
      // Primeira execução: registra versão sem mostrar modal
      setLastSeenVersion(current);
    }
  }, []);

  const handleClose = () => {
    setLastSeenVersion(version || getCurrentVersion());
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-primary">Novidades da versão {version}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-surface-light rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {notes ? (
            <div className="prose prose-sm max-w-none text-muted" dangerouslySetInnerHTML={{ __html: sanitizeHtml(notes) }} />
          ) : (
            <p className="text-sm text-muted">Atualização aplicada com sucesso. Confira as notas de release no GitHub.</p>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={handleClose}
            className="w-full py-2 bg-accent text-white rounded text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}