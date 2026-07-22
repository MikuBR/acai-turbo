import React from 'react';

export default function FinancialForm({ financialForm, setFinancialForm, onSubmit, onCancel, inputTheme }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 select-text">
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Tipo</label>
        <select value={financialForm.type} onChange={e => setFinancialForm({...financialForm, type: e.target.value})} className={inputTheme}>
          <option value="payable">A Pagar</option>
          <option value="receivable">A Receber</option>
        </select>
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Descrição</label>
        <input type="text" value={financialForm.description} onChange={e => setFinancialForm({...financialForm, description: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Valor</label>
        <input type="number" step="0.01" value={financialForm.amount} onChange={e => setFinancialForm({...financialForm, amount: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Data Vencimento</label>
        <input type="date" value={financialForm.due_date} onChange={e => setFinancialForm({...financialForm, due_date: e.target.value})} className={inputTheme} />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Status</label>
        <select value={financialForm.status} onChange={e => setFinancialForm({...financialForm, status: e.target.value})} className={inputTheme}>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Categoria</label>
        <input type="text" value={financialForm.category} onChange={e => setFinancialForm({...financialForm, category: e.target.value})} className={inputTheme} placeholder="Ex: Fornecedor, Cliente..." />
      </div>
      <button type="submit" className={`w-full ${financialForm.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
        {financialForm.id ? 'Atualizar Conta' : 'Criar Conta'}
      </button>
      {financialForm.id && (
        <button type="button" onClick={onCancel} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
      )}
    </form>
  );
}
