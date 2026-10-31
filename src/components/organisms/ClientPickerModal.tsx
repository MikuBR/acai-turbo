import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getIPC } from '../../services/ipc.js';

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  notes?: string;
}

interface ClientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
}

export default function ClientPickerModal({ isOpen, onClose, onSelect }: ClientPickerModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const ipc = getIPC();
    if (!ipc) return;
    setLoading(true);
    ipc.invoke('clients:get').then((res: any) => {
      if (res?.success) setClients(res.data || []);
    }).finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[800] flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-modal overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Selecionar cliente</h3>
          <button onClick={onClose} className="p-1.5 bg-surface-light rounded-md hover:bg-danger text-primary hover:text-white transition-all"><X size={16} /></button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-card border border-border pl-9 pr-3 py-2 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {loading && <div className="text-center text-muted text-xs py-4">Carregando...</div>}
            {!loading && filtered.length === 0 && <div className="text-center text-muted text-xs py-4">Nenhum cliente encontrado.</div>}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left p-3 rounded-lg border border-border bg-surface hover:bg-surface-light transition-colors"
              >
                <div className="font-bold text-sm text-primary">{c.name}</div>
                <div className="text-[10px] text-muted">{c.phone || '—'} {c.address ? `• ${c.address}` : ''}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
