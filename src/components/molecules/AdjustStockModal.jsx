import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

/**
 * AdjustStockModal — Modal React para ajuste de estoque.
 * Substitui a manipulação DOM direta (innerHTML + querySelector) do SettingsModal.
 *
 * @param {boolean} isOpen — Se o modal está visível
 * @param {function} onClose — Callback ao fechar
 * @param {string} productName — Nome do produto (para exibição)
 * @param {function} onConfirm — Callback ao confirmar: (delta, reason) => void
 */
export default function AdjustStockModal({ isOpen, onClose, productName, onConfirm }) {
  const [delta, setDelta] = useState('0');
  const [reason, setReason] = useState('Ajuste manual');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const numDelta = parseFloat(delta);
    if (isNaN(numDelta) || numDelta === 0) {
      setError('Informe uma quantidade válida (diferente de zero)');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('Informe um motivo com pelo menos 3 caracteres');
      return;
    }
    onConfirm(numDelta, reason.trim());
  };

  const numDelta = parseFloat(delta) || 0;
  const isPositive = numDelta > 0;
  const isNegative = numDelta < 0;

  return (
    <div className="fixed inset-0 bg-surface/80 z-[901] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-xs rounded-2xl border border-border p-6 shadow-2xl">
        <h3 className="text-xs font-bold uppercase text-muted mb-1">Ajustar Estoque</h3>
        <p className="text-[10px] text-muted mb-4 truncate">{productName}</p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase block mb-1">Quantidade</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={delta}
                onChange={(e) => { setDelta(e.target.value); setError(''); }}
                className="w-full bg-surface-light border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm pr-10"
                placeholder="0"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isPositive && <ArrowUpCircle size={18} className="text-success" />}
                {isNegative && <ArrowDownCircle size={18} className="text-danger" />}
              </div>
            </div>
            <p className="text-[9px] text-muted mt-1">
              Positivo = entrada | Negativo = saída
            </p>
          </div>

          <div>
            <label className="text-[10px] text-muted font-bold uppercase block mb-1">Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              className="w-full bg-surface-light border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
              placeholder="Ex: Ajuste manual, perda, reposição..."
            />
          </div>

          {error && (
            <div className="text-[10px] text-danger font-bold bg-danger/10 border border-danger/30 p-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-surface-light hover:bg-border py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest text-muted transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-warning hover:bg-warning py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest text-white transition-all active:scale-95"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}