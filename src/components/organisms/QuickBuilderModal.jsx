import React from 'react';
import { X } from 'lucide-react';

export default function QuickBuilderModal({ builder, onClose, setBuilder, confirmSimpleBuild, inputTheme }) {
  if (!builder) return null;

  const product = builder.product;

  return (
    <div className="fixed inset-0 bg-gray-900/95 z-[600] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Venda Direta</h2>
          <button onClick={onClose} className="p-1.5 bg-gray-200 rounded-md hover:bg-red-500 text-gray-800 hover:text-white transition-all"><X size={16}/></button>
        </div>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{product.name}</h3>
          <div className="text-emerald-500 font-mono text-lg font-bold">R${(product.price || 0).toFixed(2)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 flex flex-col items-center">
            <span className="text-[9px] text-gray-600 font-bold uppercase mb-3 tracking-widest">Quantidade</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setBuilder({...builder, quantity: Math.max(1, builder.quantity - 1)})} className="w-10 h-10 bg-gray-200 rounded-lg font-bold text-xl hover:bg-gray-300 text-gray-900">-</button>
              <span className="text-2xl font-bold text-gray-900 w-6 text-center">{builder.quantity}</span>
              <button onClick={() => setBuilder({...builder, quantity: builder.quantity + 1})} className="w-10 h-10 bg-gray-200 rounded-lg font-bold text-xl hover:bg-gray-300 text-gray-900">+</button>
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl border border-orange-500/30 flex flex-col items-center">
            <span className="text-[9px] text-orange-500 font-bold uppercase mb-3 tracking-widest">Ajuste R$</span>
            <input type="number" step="0.01" value={builder.adjustment} onChange={e => setBuilder({...builder, adjustment: e.target.value})}
              className="bg-transparent w-full text-center text-2xl font-mono font-bold text-gray-900 outline-none select-auto" placeholder="0.00" />
          </div>
        </div>
        <input type="text" placeholder="Observações..." value={builder.obs} onChange={e => setBuilder({...builder, obs: e.target.value})} className={`${inputTheme} mb-6`} />
        <button onClick={confirmSimpleBuild} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg flex justify-between px-6 items-center transition-all text-slate-950">
          <span>LANÇAR</span>
          <span className="font-mono">R${(Math.max(0, product.price + parseFloat(builder.adjustment || 0)) * builder.quantity).toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}