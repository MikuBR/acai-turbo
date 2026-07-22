import React from 'react';

export default function PromotionForm({ newPromo, setNewPromo, categories, onSubmit, onCancel, inputTheme }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 select-text">
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Nome</label>
        <input type="text" value={newPromo.name} onChange={e => setNewPromo({...newPromo, name: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Tipo</label>
        <select value={newPromo.type} onChange={e => setNewPromo({...newPromo, type: e.target.value})} className={inputTheme} required>
          <option value="PERCENTAGE">Porcentagem (%)</option>
          <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
          <option value="BUY_X_GET_Y">Compre X Leve Y</option>
        </select>
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Valor</label>
        <input type="number" step="0.01" value={newPromo.value} onChange={e => setNewPromo({...newPromo, value: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Aplica-se a</label>
        <select value={newPromo.applies_to} onChange={e => setNewPromo({...newPromo, applies_to: e.target.value})} className={inputTheme} required>
          <option value="ALL">Todos os Produtos</option>
          <option value="CATEGORY">Categoria Específica</option>
          <option value="SPECIFIC_PRODUCT">Produto Específico</option>
        </select>
      </div>
      {newPromo.applies_to === 'CATEGORY' && (
        <div>
          <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Categoria</label>
          <select value={newPromo.target_category} onChange={e => setNewPromo({...newPromo, target_category: e.target.value})} className={inputTheme} required>
            <option value="">Selecione...</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      )}
      {newPromo.applies_to === 'SPECIFIC_PRODUCT' && (
        <div>
          <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Produto ID</label>
          <input type="number" value={newPromo.target_product_id} onChange={e => setNewPromo({...newPromo, target_product_id: e.target.value})} className={inputTheme} required />
        </div>
      )}
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Qtd Mínima</label>
        <input type="number" value={newPromo.min_quantity} onChange={e => setNewPromo({...newPromo, min_quantity: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Data Início</label>
        <input type="datetime-local" value={newPromo.start_date} onChange={e => setNewPromo({...newPromo, start_date: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Data Fim</label>
        <input type="datetime-local" value={newPromo.end_date} onChange={e => setNewPromo({...newPromo, end_date: e.target.value})} className={inputTheme} required />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="promo-active" checked={newPromo.is_active} onChange={e => setNewPromo({...newPromo, is_active: e.target.checked})} className="w-4 h-4" />
        <label htmlFor="promo-active" className="text-[9px] text-muted font-bold uppercase">Ativo</label>
      </div>
      <button type="submit" className={`w-full ${newPromo.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
        {newPromo.id ? 'Atualizar Promoção' : 'Criar Promoção'}
      </button>
        {newPromo.id && (
          <button type="button" onClick={onCancel} className="w-full py-2 text-[10px] font-bold uppercase text-muted hover:text-primary transition-colors">Cancelar Edição</button>
        )}
    </form>
  );
}
