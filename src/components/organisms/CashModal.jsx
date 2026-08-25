import { useState, useEffect } from 'react';
import { X, Check, CircleDollarSign, Wallet, Lock, LogOut } from 'lucide-react';

export default function CashModal({ isOpen, onClose, runWithAuth, getIPC }) {
  const [current, setCurrent] = useState(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ipc = getIPC?.();

  const loadCurrent = async () => {
    if (!ipc) return;
    const res = await ipc.invoke('cash:get-current');
    setCurrent(res?.data || null);
  };

  const loadHistory = async () => {
    if (!ipc) return;
    const res = await ipc.invoke('cash:get-history', {});
    setHistory(res?.data || []);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadCurrent();
    loadHistory();
    const interval = setInterval(() => {
      loadCurrent();
      loadHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleOpen = async () => {
    setError('');
    const amount = Number(openingAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Informe um valor de abertura válido');
      return;
    }
    setLoading(true);
    try {
      const res = await ipc.invoke('cash:open', { openingAmount: amount });
      if (res?.id) {
        await loadCurrent();
        await loadHistory();
        setOpeningAmount('');
      } else {
        setError('Não foi possível abrir o caixa');
      }
    } catch (e) {
      setError(e?.message || 'Erro ao abrir caixa');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setError('');
    const amount = Number(closingAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Informe um valor de fechamento válido');
      return;
    }
    if (!current?.id) {
      setError('Nenhum caixa aberto encontrado');
      return;
    }
    setLoading(true);
    try {
      const res = await ipc.invoke('cash:preview-close', { closingAmount: amount });
      if (res?.success) {
        setPreview(res);
      } else {
        setError(res?.error || 'Falha ao simular fechamento');
      }
    } catch (e) {
      setError(e?.message || 'Erro ao simular fechamento');
    } finally {
      setLoading(false);
    }
  };

  const confirmClose = async () => {
    setError('');
    if (!current?.id) return;
    const amount = Number(closingAmount);
    setLoading(true);
    try {
      const res = await ipc.invoke('cash:close', { closingAmount: amount });
      if (res?.success) {
        setCurrent({ ...(res.session || current), status: 'CLOSED' });
        await loadHistory();
        setClosingAmount('');
        setPreview(null);
      } else {
        setError(res?.error || 'Falha ao fechar caixa');
      }
    } catch (e) {
      setError(e?.message || 'Erro ao fechar caixa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isOpenSession = !!current && current.status === 'OPEN';

  return (
    <div className="fixed inset-0 bg-surface z-[850] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border shadow-modal max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Caixa</h2>
          <button onClick={onClose} className="p-1.5 bg-surface-light rounded-md hover:bg-danger text-primary hover:text-white transition-all"><X size={16}/></button>
        </div>

        {isOpenSession ? (
          <div className="space-y-4">
            <div className="bg-success/10 border border-success/40 rounded-xl p-4">
              <div className="text-[10px] text-success font-bold uppercase tracking-widest">Caixa Aberto</div>
              <div className="text-[10px] text-muted mt-1">Aberto em {new Date(current.opened_at).toLocaleString()}</div>
              <div className="text-xl font-black text-primary font-mono mt-1">R$ {Number(current.opening_amount).toFixed(2)}</div>
            </div>

            <div>
              <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-2 block">Valor em Dinheiro no Caixa</label>
              <input
                type="number"
                step="0.01"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
                className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:border-primary/20 transition-all text-2xl text-center font-mono font-medium shadow-sm"
                placeholder="0.00"
              />
            </div>

            {!preview ? (
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-full bg-success hover:bg-success py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18}/> Ver Conferência
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-surface-light border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted font-bold uppercase">Abertura</span>
                    <span className="text-[10px] font-mono font-bold text-primary">R$ {Number(preview.openingAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted font-bold uppercase">Vendas em Dinheiro</span>
                    <span className="text-[10px] font-mono font-bold text-primary">R$ {Number(preview.salesCash || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border my-2"/>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted font-bold uppercase">Valor Esperado</span>
                    <span className="text-[10px] font-mono font-bold text-primary">R$ {Number(preview.expected).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted font-bold uppercase">Valor Informado</span>
                    <span className="text-[10px] font-mono font-bold text-primary">R$ {Number(preview.closingAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted font-bold uppercase">Diferença</span>
                    <span className={`text-[10px] font-mono font-bold ${preview.difference === 0 ? 'text-success' : preview.difference > 0 ? 'text-warning' : 'text-danger'}`}>R$ {Number(preview.difference).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreview(null)}
                    disabled={loading}
                    className="flex-1 bg-surface-light hover:bg-border border border-border text-primary py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={confirmClose}
                    disabled={loading}
                    className="flex-1 bg-success hover:bg-success py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={16}/> Confirmar Fechamento
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-surface-light border border-border rounded-xl p-4">
              <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Nenhum caixa aberto</div>
              <div className="text-[10px] text-muted mt-1">Abra o caixa antes de iniciar as vendas.</div>
            </div>

            <div>
              <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-2 block">Valor de Abertura</label>
              <input
                type="number"
                step="0.01"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:border-primary/20 transition-all text-2xl text-center font-mono font-medium shadow-sm"
                placeholder="0.00"
              />
            </div>

            <button
              onClick={handleOpen}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet size={18}/> Abrir Caixa
            </button>
          </div>
        )}

        {error && <div className="text-[10px] text-danger font-bold mt-3">{error}</div>}

        <div className="mt-6 border-t border-border pt-4">
          <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2">Histórico Recente</div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {history.length === 0 && <div className="text-[10px] text-muted">Sem registros</div>}
            {history.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-surface-light border border-border rounded-lg p-3">
                <div>
                  <div className="text-[10px] font-bold text-primary">{s.status === 'OPEN' ? 'Aberto' : 'Fechado'}</div>
                  <div className="text-[10px] text-muted">{new Date(s.opened_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted">Abertura</div>
                  <div className="text-[10px] font-mono font-bold text-primary">R$ {Number(s.opening_amount).toFixed(2)}</div>
                  {s.status === 'CLOSED' && (
                    <div className="text-[10px] font-mono font-bold text-success">Diferença: R$ {Number(s.difference || 0).toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
