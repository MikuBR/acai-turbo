import { X, Check } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, activeTable, promotions, selectedPromotion, setSelectedPromotion, calculateDiscount, paymentMethod, setPaymentMethod, amountReceived, setAmountReceived, handleFinalize, }) {
  if (!isOpen) return null;

  const discount = selectedPromotion && activeTable ? calculateDiscount(selectedPromotion, activeTable.total || 0) : 0;
  const finalTotal = activeTable ? activeTable.total - discount : 0;

  return (
    <div className="fixed inset-0 bg-surface z-[800] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border shadow-2xl">
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

        <div className="grid grid-cols-2 gap-2 mb-6">
          {['DINHEIRO', 'PIX', 'DÉBITO', 'CRÉDITO'].map(m => (
            <button 
              key={m} 
              onClick={() => setPaymentMethod(m)}
              className={`py-2 rounded-lg border font-bold text-[10px] transition-all ${paymentMethod === m ? 'bg-success border-success text-white' : 'bg-surface-light border-border text-muted'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-2 block">Dinheiro Recebido</label>
          <input type="number" step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-2xl text-center font-mono font-medium shadow-sm" placeholder="0.00" />
          {amountReceived && activeTable && parseFloat(amountReceived) >= finalTotal && (
            <div className="mt-4 p-3 bg-surface-light border border-border rounded-lg text-center animate-in fade-in">
              <span className="text-[10px] text-muted font-bold uppercase tracking-widest block mb-1">Troco a Devolver</span>
              <span className="text-2xl font-bold text-warning font-mono">R$ {(parseFloat(amountReceived) - finalTotal).toFixed(2)}</span>
            </div>
          )}
        </div>
        <button onClick={handleFinalize} className="w-full bg-success hover:bg-success py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95">
          <Check size={18} /> Confirmar & Imprimir
        </button>
      </div>
    </div>
  );
}
