import { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';

const PAYMENT_METHODS = ['DINHEIRO', 'PIX', 'DÉBITO', 'CRÉDITO', 'PERMUTA'];

export default function CheckoutModal({ isOpen, onClose, activeTable, promotions, selectedPromotion, setSelectedPromotion, calculateDiscount, onFinalize }) {
  const [payments, setPayments] = useState([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [pendingMethod, setPendingMethod] = useState('DINHEIRO');
  const [pendingAmount, setPendingAmount] = useState('');
  const [pendingExchangeFor, setPendingExchangeFor] = useState('');

  if (!isOpen) return null;

  const discount = selectedPromotion && activeTable ? calculateDiscount(selectedPromotion, activeTable.total || 0) : 0;
  const finalTotal = activeTable ? activeTable.total - discount : 0;
  const sumPayments = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, finalTotal - sumPayments);

  const cashPayments = payments.filter(p => p.method === 'DINHEIRO');
  const hasCash = cashPayments.length > 0;
  const cashTarget = hasCash ? Math.max(0, finalTotal - (sumPayments - cashPayments.reduce((s, p) => s + p.amount, 0))) : 0;
  const amt = Number(amountReceived) || 0;
  const change = hasCash ? Math.max(0, amt - cashTarget) : 0;

  const isComplete = Math.round(sumPayments * 100) >= Math.round(finalTotal * 100);
  const hasValidCash = !hasCash || (amt >= cashTarget);
  const canConfirm = isComplete && payments.length > 0 && hasValidCash;

  const hasPermuta = payments.some(p => p.method === 'PERMUTA');

  const openAddPayment = () => {
    setPendingMethod('DINHEIRO');
    setPendingAmount(remaining > 0 ? remaining.toFixed(2) : '');
    setPendingExchangeFor('');
    setShowAddPayment(true);
  };

  const addPayment = () => {
    const amt = Number(pendingAmount) || 0;
    if (amt <= 0) return;
    const truncatedAmt = Math.min(amt, remaining > 0 ? remaining : amt);

    if (pendingMethod === 'PERMUTA') {
      const finalAmt = Math.min(amt, finalTotal);
      setPayments([{ method: 'PERMUTA', amount: finalAmt, exchangeFor: pendingExchangeFor.trim() }]);
    } else {
      if (hasPermuta) setPayments([]);
      setPayments(prev => [...prev.filter(p => p.method !== 'PERMUTA'), { method: pendingMethod, amount: truncatedAmt }]);
    }
    setShowAddPayment(false);
    setAmountReceived('');
  };

  const removePayment = (idx) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 bg-surface z-[800] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border shadow-modal max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-success">Caixa: {activeTable?.name || '---'}</h2>
          <button onClick={onClose} className="p-1.5 bg-surface-light rounded-md hover:bg-danger text-primary hover:text-white transition-all"><X size={16}/></button>
        </div>

        <div className="text-center mb-6">
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest block mb-1">Total a Pagar</span>
          <span className="text-4xl font-black text-success font-mono tracking-tighter">R$ {finalTotal.toFixed(2)}</span>
        </div>

        <div className="mb-6">
          <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-2 block">Promoção</label>
          <select
            value={selectedPromotion?.id || ''}
            onChange={e => {
              const promo = promotions.find(p => p.id === parseInt(e.target.value));
              setSelectedPromotion(promo || null);
            }}
            className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
          >
            <option value="">Sem promoção</option>
            {promotions.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.type === 'PERCENTAGE' ? p.value + '%' : 'R$' + p.value})</option>
            ))}
          </select>
          {selectedPromotion && (
            <div className="mt-2 text-[9px] text-success font-bold uppercase">
              Desconto: R$ {discount.toFixed(2)}
            </div>
          )}
        </div>

        {/* --- LISTA DE PAGAMENTOS (TAGS) --- */}
        <div className="mb-6">
          <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-2 block">Forma(s) de Pagamento</label>
          {payments.length > 0 ? (
            <div className="space-y-2 mb-3">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-light border border-border rounded-lg p-3 group animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${p.method === 'PERMUTA' ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'}`}>{p.method}</span>
                    {p.exchangeFor && <span className="text-[10px] text-muted italic truncate max-w-[180px]">· {p.exchangeFor}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-success text-sm">R$ {p.amount.toFixed(2)}</span>
                    <button
                      onClick={() => removePayment(i)}
                      aria-label={`Remover pagamento ${i + 1}: ${p.method} R$ ${p.amount.toFixed(2)}`}
                      title="Remover"
                      className="p-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                  {isComplete ? '✓ Pago' : `Faltam: R$ ${remaining.toFixed(2)}`}
                </span>
                <span className="text-[10px] text-muted font-mono">Total: R$ {sumPayments.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted text-xs py-4 bg-surface-light rounded-lg border border-border mb-3">
              Nenhuma forma de pagamento adicionada
            </div>
          )}

          {!showAddPayment && !hasPermuta && (
            <button onClick={openAddPayment} className="w-full bg-surface-light border border-dashed border-border hover:border-primary hover:bg-primary/5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted hover:text-primary transition-all flex items-center justify-center gap-2">
              <Plus size={14}/> Adicionar Pagamento
            </button>
          )}
        </div>

        {/* --- OVERLAY ADICIONAR PAGAMENTO --- */}
        {showAddPayment && (
          <div className="mb-6 bg-surface-light border border-border rounded-xl p-4 animate-in fade-in">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Adicionar Pagamento</span>
              <button onClick={() => setShowAddPayment(false)} className="p-1 hover:bg-danger/10 rounded text-muted hover:text-danger transition-all"><X size={14}/></button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setPendingMethod(m);
                    setPendingAmount(remaining > 0 ? remaining.toFixed(2) : '');
                  }}
                  className={`py-2 rounded-lg border font-bold text-[10px] transition-all ${pendingMethod === m ? (m === 'PERMUTA' ? 'bg-warning border-warning text-white' : 'bg-primary border-primary text-white') : 'bg-card border-border text-muted hover:text-primary'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {pendingMethod === 'PERMUTA' && (
              <div className="text-[9px] text-warning bg-warning/10 border border-warning/30 rounded p-2 mb-3">
                ⚠ Permuta é exclusiva e substituirá todos os pagamentos atuais. O valor será igual ao total do pedido.
              </div>
            )}

            <div className="mb-3">
              <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">
                Valor {pendingMethod !== 'PERMUTA' && remaining > 0 ? `(sugestão: R$ ${remaining.toFixed(2)})` : ''}
              </label>
              <input
                type="number"
                step="0.01"
                value={pendingAmount}
                onChange={e => setPendingAmount(e.target.value)}
                className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg text-center font-mono font-bold shadow-sm"
                placeholder="0.00"
                autoFocus
              />
              {pendingMethod !== 'PERMUTA' && Number(pendingAmount) > remaining && remaining > 0 && (
                <div className="text-[9px] text-danger mt-1">Valor excede o restante (R$ {remaining.toFixed(2)})</div>
              )}
            </div>

            {pendingMethod === 'PERMUTA' && (
              <div className="mb-3">
                <label className="text-[10px] text-warning font-bold uppercase ml-1 mb-1 block">Trocado Por (descrição)</label>
                <input
                  type="text"
                  value={pendingExchangeFor}
                  onChange={e => setPendingExchangeFor(e.target.value)}
                  className="w-full bg-card border border-warning/50 p-3 rounded-lg text-primary outline-none focus:border-warning focus:ring-2 focus:ring-warning/20 transition-all text-sm font-medium shadow-sm"
                  placeholder="Ex: 2 litros de leite, R$ 30 em mercadoria..."
                />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowAddPayment(false)} className="flex-1 bg-surface-light border border-border py-2.5 rounded-lg text-xs font-bold uppercase text-muted hover:text-primary transition-all">Cancelar</button>
              <button
                onClick={addPayment}
                disabled={pendingMethod === 'PERMUTA' ? !pendingExchangeFor.trim() || !pendingAmount : !pendingAmount || Number(pendingAmount) <= 0}
                className="flex-1 bg-primary hover:bg-primary py-2.5 rounded-lg text-xs font-bold uppercase text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        )}

        {/* --- DINHEIRO RECEBIDO + TROCO --- */}
        {hasCash && !showAddPayment && (
          <div className="mb-6">
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-2 block">Dinheiro Recebido</label>
            <input
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={e => setAmountReceived(e.target.value)}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-2xl text-center font-mono font-medium shadow-sm"
              placeholder="0.00"
            />
            {hasCash && amt > cashTarget && amt > 0 && (
              <div className="mt-3 p-3 bg-surface-light border border-border rounded-lg text-center animate-in fade-in">
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest block mb-1">Troco a Devolver</span>
                <span className="text-2xl font-bold text-warning font-mono">R$ {change.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => canConfirm && onFinalize({ payments, amountReceived })}
          disabled={!canConfirm}
          className="w-full bg-success hover:bg-success py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <Check size={18}/> Confirmar & Imprimir
        </button>
      </div>
    </div>
  );
}
