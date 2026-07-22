import React from 'react';
import { X } from 'lucide-react';

export default function AcaiBuilderModal({ builder, onClose, setBuilder, acaiBases, availableAddons, toggleRemoval, updateExtraInBuilder, confirmFullBuild, inputTheme }) {
  if (!builder) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/95 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl border border-gray-300 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center px-6">
          <h2 className="font-bold text-sm uppercase tracking-widest text-gray-900">Montagem Personalizada</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-all"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <section>
              <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 border-l-2 border-emerald-500 pl-2">1. Tamanho</h3>
              <div className="grid grid-cols-1 gap-2">
                {acaiBases.map(b => (
                  <button key={b.id} onClick={() => setBuilder({...builder, base: b, standard: b.ingredients ? b.ingredients.split(',').map(i=>i.trim()) : []})}
                    className={`p-3 rounded-lg border transition-all text-left ${builder.base?.id === b.id ? 'bg-emerald-600/10 border-emerald-500' : 'bg-gray-100 border-gray-300 hover:border-gray-400'}`}>
                    <div className="font-bold text-xs text-gray-900 uppercase">{b.name}</div>
                    <div className="font-mono text-[10px] text-emerald-500">R${(b.price || 0).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </section>
            {builder.standard && builder.standard.length > 0 && (
              <section className={!builder.base ? 'opacity-20 pointer-events-none' : ''}>
                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 border-l-2 border-red-500 pl-2">2. Retiradas</h3>
                <div className="flex flex-wrap gap-2">
                  {(builder.standard || []).map(ing => (
                    <button key={ing} onClick={() => toggleRemoval(ing)}
                      className={`px-3 py-1.5 rounded-md border text-[9px] font-bold transition-all ${builder.removals.includes(ing) ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-gray-200 border-gray-300 text-gray-600'}`}>
                      {builder.removals.includes(ing) ? 'SEM ' : '+ '} {ing}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className={!builder.base ? 'opacity-20 pointer-events-none' : ''}>
              <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 border-l-2 border-orange-500 pl-2">4. Notas e Ajuste</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Observação..." value={builder.obs} onChange={e => setBuilder({...builder, obs: e.target.value})} className={inputTheme} />
                <div className="bg-gray-100 border border-gray-300 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-600 uppercase">Ajuste R$</span>
                  <input type="number" step="0.01" value={builder.adjustment} onChange={e => setBuilder({...builder, adjustment: e.target.value})}
                    className="bg-transparent text-right text-lg font-mono text-gray-900 outline-none font-bold w-20 select-auto" />
                </div>
              </div>
            </section>
          </div>
          <div className={`flex-1 flex flex-col border-l border-gray-300 pl-6 ${!builder.base ? 'opacity-20 pointer-events-none' : ''}`}>
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-l-2 border-purple-500 pl-2">3. Adicionais Extras</h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 pr-2 custom-scrollbar">
              {availableAddons.map(a => {
                const existing = builder.extras.find(e => e.id === a.id);
                const qty = existing ? existing.qty : 0;
                return (
                  <div key={a.id} className={`p-3 rounded-xl border transition-all flex items-center justify-between ${qty > 0 ? 'bg-purple-600/10 border-purple-500' : 'bg-gray-100 border-gray-300'}`}>
                    <div className="flex flex-col min-w-0"><span className="font-bold text-[10px] uppercase text-gray-800 truncate">{a.name}</span><span className="font-mono text-emerald-500 text-[9px]">R${(a.price || 0).toFixed(2)}</span></div>
                    <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg border border-gray-300">
                      <button onClick={() => updateExtraInBuilder(a, -1)} className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400">-</button>
                      <span className={`text-xs font-bold w-4 text-center ${qty > 0 ? 'text-purple-400' : 'text-gray-600'}`}>{qty}</span>
                      <button onClick={() => updateExtraInBuilder(a, 1)} className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-100 border-t border-gray-300 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-300">
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Qtd</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setBuilder({...builder, quantity: Math.max(1, builder.quantity - 1)})} className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300">-</button>
              <span className="text-xl font-bold text-emerald-500 w-6 text-center">{builder.quantity}</span>
              <button onClick={() => setBuilder({...builder, quantity: builder.quantity + 1})} className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300">+</button>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-[9px] font-bold text-gray-600 uppercase mb-0.5 block">Total Montagem</span>
              <span className="text-3xl font-mono font-black text-emerald-500 italic">
                R${(((builder.base?.price || 0) + builder.extras.reduce((s,e) => s+(e.price*e.qty), 0) + parseFloat(builder.adjustment || 0)) * builder.quantity).toFixed(2)}
              </span>
            </div>
            <button disabled={!builder.base} onClick={confirmFullBuild}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 text-slate-950 font-bold py-3 px-8 rounded-xl transition-all active:scale-95">LANÇAR</button>
          </div>
        </div>
      </div>
    </div>
  );
}