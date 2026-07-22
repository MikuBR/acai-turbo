import React from 'react';
import { Plus, X } from 'lucide-react';

export default function CategoryForm({ newCatName, setNewCatName, categories, onAdd, onDelete, inputTheme }) {
  return (
    <section className="mb-10">
      <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">Gerenciar Categorias</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nova Categoria..."
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          className={inputTheme}
        />
        <button
          onClick={onAdd}
          className="p-2 bg-emerald-600 text-slate-950 rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="space-y-1">
        {categories.map(cat => (
          <div key={cat.id} className="flex justify-between items-center bg-surface-light/50 p-2 rounded border border-border/50 group">
            <span className="text-[10px] font-bold text-muted uppercase">{cat.name}</span>
            <button
              onClick={() => onDelete(cat)}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
