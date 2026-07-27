import { X } from 'lucide-react';

export default function AcaiBuilderModal({ builder, onClose, setBuilder, acaiBases, availableAddons, toggleRemoval, updateExtraInBuilder, confirmFullBuild, }) {
  if (!builder) return null;

  return (
    <div className="fixed inset-0 bg-surface z-[500] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-5xl h-[85vh] rounded-2xl border border-border flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 bg-surface-light border-b border-border flex justify-between items-center px-6">
          <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Montagem Personalizada</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-danger/20 rounded-md text-muted hover:text-danger transition-all"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <section>
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 border-l-2 border-success pl-2">1. Tamanho</h3>
              <div className="grid grid-cols-1 gap-2">
                {acaiBases.map(b => (
                  <button key={b.id} onClick={() => setBuilder({...builder, base: b, standard: b.ingredients ? b.ingredients.split(',').map(i=>i.trim()) : []})}
                    className={`p-3 rounded-lg border transition-all text-left ${builder.base?.id === b.id ? 'bg-success/10 border-success' : 'bg-surface-light border-border hover:border-border'}`}>
                    <div className="font-bold text-xs text-primary uppercase">{b.name}</div>
                    <div className="font-mono text-[10px] text-success">R${(b.price || 0).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </section>
            {builder.standard && builder.standard.length > 0 && (
              <section className={!builder.base ? 'opacity-20 pointer-events-none' : ''}>
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 border-l-2 border-danger pl-2">2. Retiradas</h3>
                <div className="flex flex-wrap gap-2">
                  {(builder.standard || []).map(ing => (
                    <button key={ing} onClick={() => toggleRemoval(ing)}
                      className={`px-3 py-1.5 rounded-md border text-[9px] font-bold transition-all ${builder.removals.includes(ing) ? 'bg-danger/10 border-danger text-danger' : 'bg-surface-light border-border text-muted'}`}>
                      {builder.removals.includes(ing) ? 'SEM ' : '+ '} {ing}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className={!builder.base ? 'opacity-20 pointer-events-none' : ''}>
              <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 border-l-2 border-warning pl-2">4. Notas e Ajuste</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Observação..." value={builder.obs} onChange={e => setBuilder({...builder, obs: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                <div className="bg-surface-light border border-border p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[9px] font-bold text-muted uppercase">Ajuste R$</span>
                  <input type="number" step="0.01" value={builder.adjustment} onChange={e => setBuilder({...builder, adjustment: e.target.value})}
                    className="bg-transparent text-right text-lg font-mono text-primary outline-none font-bold w-20 select-auto" />
                </div>
              </div>
            </section>
          </div>
          <div className={`flex-1 flex flex-col border-l border-border pl-6 ${!builder.base ? 'opacity-20 pointer-events-none' : ''}`}>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-l-2 border-primary pl-2">3. Adicionais Extras</h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 pr-2 custom-scrollbar">
              {availableAddons.map(a => {
                const existing = builder.extras.find(e => e.id === a.id);
                const qty = existing ? existing.qty : 0;
                return (
                  <div key={a.id} className={`p-3 rounded-xl border transition-all flex items-center justify-between ${qty > 0 ? 'bg-primary/10 border-primary' : 'bg-surface-light border-border'}`}>
                    <div className="flex flex-col min-w-0"><span className="font-bold text-[10px] uppercase text-primary truncate">{a.name}</span><span className="font-mono text-success text-[9px]">R${(a.price || 0).toFixed(2)}</span></div>
                    <div className="flex items-center gap-2 bg-surface-light p-1 rounded-lg border border-border">
                      <button onClick={() => updateExtraInBuilder(a, -1)} className="w-6 h-6 bg-surface-light rounded flex items-center justify-center hover:bg-border">-</button>
                      <span className={`text-xs font-bold w-4 text-center ${qty > 0 ? 'text-primary font-bold' : 'text-muted'}`}>{qty}</span>
                      <button onClick={() => updateExtraInBuilder(a, 1)} className="w-6 h-6 bg-surface-light rounded flex items-center justify-center hover:bg-border">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="p-4 bg-surface-light border-t border-border flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-surface-light px-4 py-2 rounded-xl border border-border">
            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Qtd</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setBuilder({...builder, quantity: Math.max(1, builder.quantity - 1)})} className="w-8 h-8 bg-surface-light rounded-lg flex items-center justify-center hover:bg-border">-</button>
              <span className="text-xl font-bold text-success w-6 text-center">{builder.quantity}</span>
              <button onClick={() => setBuilder({...builder, quantity: builder.quantity + 1})} className="w-8 h-8 bg-surface-light rounded-lg flex items-center justify-center hover:bg-border">+</button>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-[9px] font-bold text-muted uppercase mb-0.5 block">Total Montagem</span>
              <span className="text-3xl font-mono font-black text-success italic">
                R${(((builder.base?.price || 0) + builder.extras.reduce((s,e) => s+(e.price*e.qty), 0) + parseFloat(builder.adjustment || 0)) * builder.quantity).toFixed(2)}
              </span>
            </div>
            <button disabled={!builder.base} onClick={confirmFullBuild}
              className="bg-success hover:bg-success disabled:bg-surface-light text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95">LANÇAR</button>
          </div>
        </div>
      </div>
    </div>
  );
}