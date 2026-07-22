import React from 'react';

export default function ClientForm({ clientForm, setClientForm, onSubmit, onCancel, inputTheme }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 select-text">
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome</label>
        <input type="text" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Telefone</label>
        <input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className={inputTheme} />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Endereço</label>
        <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className={inputTheme} />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Email</label>
        <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className={inputTheme} />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Observações</label>
        <textarea value={clientForm.notes} onChange={e => setClientForm({...clientForm, notes: e.target.value})} className={inputTheme} rows="2" />
      </div>
      <button type="submit" className={`w-full ${clientForm.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
        {clientForm.id ? 'Atualizar Cliente' : 'Criar Cliente'}
      </button>
      {clientForm.id && (
        <button type="button" onClick={onCancel} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
      )}
    </form>
  );
}