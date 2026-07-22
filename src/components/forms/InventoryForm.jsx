import React from 'react';

export default function InventoryForm({ inventoryForm, setInventoryForm, products, onSubmit, inputTheme }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 select-text">
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Produto</label>
        <select value={inventoryForm.productId} onChange={e => setInventoryForm({...inventoryForm, productId: e.target.value})} className={inputTheme} required>
          <option value="">Selecione...</option>
          {products.filter(p => p.category !== 'ADICIONAIS DOCES').map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Quantidade</label>
        <input type="number" step="0.01" value={inventoryForm.quantity} onChange={e => setInventoryForm({...inventoryForm, quantity: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Unidade</label>
        <select value={inventoryForm.unit} onChange={e => setInventoryForm({...inventoryForm, unit: e.target.value})} className={inputTheme}>
          <option value="un">Unidade</option>
          <option value="kg">Quilograma</option>
          <option value="l">Litro</option>
          <option value="cx">Caixa</option>
        </select>
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Estoque Mínimo</label>
        <input type="number" step="0.01" value={inventoryForm.minQuantity} onChange={e => setInventoryForm({...inventoryForm, minQuantity: e.target.value})} className={inputTheme} />
      </div>
      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95">Adicionar ao Estoque</button>
    </form>
  );
}
