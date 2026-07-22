import React from 'react';
import { X, Check } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, activeTable, promotions, selectedPromotion, setSelectedPromotion, calculateDiscount, paymentMethod, setPaymentMethod, amountReceived, setAmountReceived, handleFinalize, inputTheme }) {
  if (!isOpen) return null;

  const discount = selectedPromotion ? calculateDiscount(selectedPromotion, activeTable.total) : 0;
  const finalTotal = activeTable.total - discount;

  return (
    <div className="fixed inset-0 bg-gray-900/95 z-[800] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Caixa: {activeTable.name}</h2>
          <button onClick={onClose} className="p-1.5 bg-gray-200 rounded-md hover:bg-red-500 text-gray-800 hover:text-white transition-all"><X size={16}/></button>
        </div>
        
        <div className="text-center mb-6">
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Total a Pagar</span>
          <span className="text-4xl font-black text-emerald-500 font-mono tracking-tighter">R$ {finalTotal.toFixed(2)}</span>
        </div>

        <div className="mb-6">
          <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-2 block">Promoção</label>
          <select 
            value={selectedPromotion?.id || ''} 
            onChange={e => {
              const promo = promotions.find(p => p.id === parseInt(e.target.value));
              setSelectedPromotion(promo || null);
            }}
            className={inputTheme}
          >
            <option value="">Sem promoção</option>
            {promotions.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.type === 'PERCENTAGE' ? p.value + '%' : 'R$' + p.value})</option>
            ))}
          </select>
          {selectedPromotion && (
            <div className="mt-2 text-[9px] text-emerald-500 font-bold uppercase">
              Desconto: R$ {discount.toFixed(2)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {['DINHEIRO', 'PIX', 'DÉBITO', 'CRÉDITO'].map(m => (
            <button 
              key={m} 
              onClick={() => setPaymentMethod(m)}
              className={`py-2 rounded-lg border font-bold text-[10px] transition-all ${paymentMethod === m ? 'bg-emerald-600 border-emerald-400 text-slate-950' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-2 block">Dinheiro Recebido</label>
          <input type="number" step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className={`${inputTheme} text-2xl text-center font-mono`} placeholder="0.00" />
          {amountReceived && parseFloat(amountReceived) >= activeTable.total && (
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-center animate-in fade-in">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Troco a Devolver</span>
              <span className="text-2xl font-bold text-orange-500 font-mono">R$ {(parseFloat(amountReceived) - activeTable.total).toFixed(2)}</span>
            </div>
          )}
        </div>
        <button onClick={handleFinalize} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-95">
          <Check size={18} /> Confirmar & Imprimir
        </button>
      </div>
    </div>
  );
}
