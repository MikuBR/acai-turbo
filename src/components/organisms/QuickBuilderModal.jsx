import React from 'react';
import { X } from 'lucide-react';

export default function QuickBuilderModal({ builder, onClose, setBuilder, confirmSimpleBuild, }) {
  if (!builder) return null;

  const product = builder.product;

  return (
    <div className="fixed inset-0 bg-surface z-[600] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-success">Venda Direta</h2>
          <button onClick={onClose} className="p-1.5 bg-surface-light rounded-md hover:bg-danger text-primary hover:text-white transition-all"><X size={16}/></button>
        </div>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-primary uppercase tracking-tight mb-2">{product.name}</h3>
          <div className="text-success font-mono text-lg font-bold">R${(product.price || 0).toFixed(2)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-light p-4 rounded-xl border border-border flex flex-col items-center">
            <span className="text-[9px] text-muted font-bold uppercase mb-3 tracking-widest">Quantidade</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setBuilder({...builder, quantity: Math.max(1, builder.quantity - 1)})} className="w-10 h-10 bg-surface-light rounded-lg font-bold text-xl hover:bg-border text-primary">-</button>
              <span className="text-2xl font-bold text-primary w-6 text-center">{builder.quantity}</span>
              <button onClick={() => setBuilder({...builder, quantity: builder.quantity + 1})} className="w-10 h-10 bg-surface-light rounded-lg font-bold text-xl hover:bg-border text-primary">+</button>
            </div>
          </div>
          <div className="bg-surface-light p-4 rounded-xl border border-warning/30 flex flex-col items-center">
            <span className="text-[9px] text-warning font-bold uppercase mb-3 tracking-widest">Ajuste R$</span>
            <input type="number" step="0.01" value={builder.adjustment} onChange={e => setBuilder({...builder, adjustment: e.target.value})}
              className="bg-transparent w-full text-center text-2xl font-mono font-bold text-primary outline-none select-auto" placeholder="0.00" />
          </div>
        </div>
        <input type="text" placeholder="Observações..." value={builder.obs} onChange={e => setBuilder({...builder, obs: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm mb-6" />
        <button onClick={confirmSimpleBuild} className="w-full bg-success hover:bg-success py-4 rounded-xl font-bold text-lg flex justify-between px-6 items-center transition-all text-white">
          <span>LANÇAR</span>
          <span className="font-mono">R${(Math.max(0, product.price + parseFloat(builder.adjustment || 0)) * builder.quantity).toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}