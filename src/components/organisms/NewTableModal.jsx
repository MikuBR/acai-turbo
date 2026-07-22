import React from 'react';
import { X } from 'lucide-react';

export default function NewTableModal({ isOpen, onClose, tableType, setTableType, newTableName, setNewTableName, delivForm, setDelivForm, handleAddTable, inputTheme }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface z-[700] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Nova Comanda</h2>
          <button onClick={onClose} className="p-1.5 bg-surface-light rounded-md hover:bg-red-500 text-primary hover:text-white transition-all"><X size={16}/></button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTableType('SALAO')}
            className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${
              tableType === 'SALAO' ? 'bg-indigo-600 text-white' : 'bg-surface-light border border-border text-muted'
            }`}>Mesa / Balcão</button>
          <button onClick={() => setTableType('DELIVERY')}
            className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${
              tableType === 'DELIVERY' ? 'bg-orange-600 text-white' : 'bg-surface-light border border-border text-muted'
            }`}>Delivery</button>
        </div>

        {tableType === 'SALAO' ? (
          <input
            type="text" placeholder="Ex: Mesa 04, Balcão 2..." value={newTableName}
            onChange={e => setNewTableName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTable(); }}
            className={`${inputTheme} mb-4 text-lg font-bold`} autoFocus
          />
        ) : (
          <div className="space-y-3 mb-6">
            <input type="text" placeholder="Nome do Cliente*" value={delivForm.name} onChange={e => setDelivForm({...delivForm, name: e.target.value})} className={inputTheme} autoFocus />
            <input type="text" placeholder="Telefone" value={delivForm.phone} onChange={e => setDelivForm({...delivForm, phone: e.target.value})} className={inputTheme} />
            <input type="text" placeholder="Endereço Completo" value={delivForm.address} onChange={e => setDelivForm({...delivForm, address: e.target.value})} className={inputTheme} />
            <div className="bg-surface-light border border-border p-3 rounded-xl flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted uppercase">Taxa Entrega R$</span>
              <input type="number" step="0.01" value={delivForm.fee} onChange={e => setDelivForm({...delivForm, fee: e.target.value})}
                className="bg-transparent text-right text-lg font-mono text-primary outline-none font-bold w-20" placeholder="0.00" />
            </div>
          </div>
        )}

        <button onClick={handleAddTable} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-950 transition-all active:scale-95">
          Abrir Comanda
        </button>
      </div>
    </div>
  );
}
