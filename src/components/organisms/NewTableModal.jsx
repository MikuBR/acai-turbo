import { useRef } from 'react';
import { X } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

export default function NewTableModal({ isOpen, onClose, tableType, setTableType, newTableName, setNewTableName, delivForm, setDelivForm, handleAddTable }) {
  const containerRef = useFocusTrap(isOpen);

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const feeRef = useRef(null);

  if (!isOpen) return null;

  const moveToNext = (e, nextRef) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    nextRef.current?.focus();
  };

  const handleFeeEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleAddTable();
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-surface z-[700] flex items-center justify-center p-6 animate-in zoom-in duration-200">
      <div className="bg-card p-8 rounded-2xl w-full max-w-md border border-border shadow-modal">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-success">Nova Comanda</h2>
          <button onClick={onClose} className="p-1.5 bg-surface-light rounded-md hover:bg-danger text-primary hover:text-white transition-all"><X size={16}/></button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTableType('SALAO')}
            className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${
              tableType === 'SALAO' ? 'bg-primary text-white' : 'bg-surface-light border border-border text-muted'
            }`}>Mesa / Balcão</button>
          <button onClick={() => setTableType('DELIVERY')}
            className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${
              tableType === 'DELIVERY' ? 'bg-warning text-white' : 'bg-surface-light border border-border text-muted'
            }`}>Delivery</button>
        </div>

        {tableType === 'SALAO' ? (
          <input
            type="text" placeholder="Ex: Mesa 04, Balcão 2..." value={newTableName}
            onChange={e => setNewTableName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTable(); } }}
            className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium shadow-sm mb-4 text-lg font-bold" autoFocus
          />
        ) : (
          <div className="space-y-3 mb-6">
            <input
              ref={nameRef}
              type="text" placeholder="Nome do Cliente* — Ex: João Silva" value={delivForm.name}
              onChange={e => setDelivForm({...delivForm, name: e.target.value})}
              onKeyDown={e => moveToNext(e, phoneRef)}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" autoFocus
            />
            <input
              ref={phoneRef}
              type="text" placeholder="Telefone — Ex: (11) 99999-9999" value={delivForm.phone}
              onChange={e => setDelivForm({...delivForm, phone: e.target.value})}
              onKeyDown={e => moveToNext(e, addressRef)}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
            />
            <input
              ref={addressRef}
              type="text" placeholder="Endereço Completo — Ex: Rua das Flores, 123" value={delivForm.address}
              onChange={e => setDelivForm({...delivForm, address: e.target.value})}
              onKeyDown={e => moveToNext(e, feeRef)}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
            />
            <div className="bg-surface-light border border-border p-3 rounded-xl flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted uppercase">Taxa Entrega R$</span>
              <input
                ref={feeRef}
                type="number" step="0.01" value={delivForm.fee}
                onChange={e => setDelivForm({...delivForm, fee: e.target.value})}
                onKeyDown={handleFeeEnter}
                className="bg-transparent text-right text-lg font-mono text-primary outline-none font-bold w-20" placeholder="Ex: 5.00"
              />
            </div>
          </div>
        )}

        <button onClick={handleAddTable} className="w-full bg-success hover:bg-success py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all active:scale-95">
          Abrir Comanda
        </button>
      </div>
    </div>
  );
}
