import React from 'react';

export default function ProductForm({ newProd, setNewProd, categories, onSubmit, onCancel, inputTheme }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 select-text">
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome</label>
        <input type="text" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Ficha Técnica</label>
        <input type="text" placeholder="Ingredientes padrão..." value={newProd.ingredients} onChange={e => setNewProd({...newProd, ingredients: e.target.value})} className={inputTheme} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Preço</label>
          <input type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} className={inputTheme} required />
        </div>
        <div>
          <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Categoria</label>
          <input type="text" list="cat-list-adm" value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} className={inputTheme} required />
          <datalist id="cat-list-adm">
            {categories.map(c => <option key={c.id} value={c.name}/>)}
            <option value="ADICIONAIS DOCES"/>
          </datalist>
        </div>
      </div>
      <button type="submit" className={`w-full ${newProd.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
        {newProd.id ? 'Atualizar Produto' : 'Salvar Produto'}
      </button>
      {newProd.id && (
        <button type="button" onClick={onCancel} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
      )}
    </form>
  );
}
