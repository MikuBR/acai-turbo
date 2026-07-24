import React from 'react';
import { FileText, Settings, X } from 'lucide-react';

export default function Sidebar({ safeTables, activeTableId, setActiveTable, onReportsClick, onSettingsClick, handleLogout }) {
  const activeTable = safeTables.find(t => t.id === activeTableId) || safeTables[0] || null;

  return (
    <div className="w-64 shrink-0 bg-surface border-r border-border flex flex-col shadow-xl z-10">
      <div className="p-5 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-success rounded-full"></div>
          <span className="font-bold text-sm tracking-widest text-primary uppercase">TURBO PDV</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onReportsClick} className="p-1.5 hover:bg-surface-light rounded-md text-muted hover:text-success transition-colors" title="Caixa e Relatórios">
            <FileText size={18}/>
          </button>
          <button onClick={onSettingsClick} className="p-1.5 hover:bg-surface-light rounded-md text-muted hover:text-primary transition-colors" title="Configurações">
            <Settings size={18}/>
          </button>
          <button onClick={handleLogout} className="p-1.5 hover:bg-danger/20 rounded-md text-muted hover:text-danger transition-colors" title="Sair">
            <X size={18}/>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {safeTables.map(t => (
          <button key={t.id} onClick={() => setActiveTable(t.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
              activeTableId === t.id ? 'bg-success/10 border-success shadow-sm' : 'bg-transparent border-transparent hover:bg-surface-light/40'
            }`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold text-xs uppercase tracking-tight truncate pr-2 ${
                activeTableId === t.id ? 'text-success' : 'text-muted'
              }`}>
                {t.isDelivery && <span className="mr-1">🛵</span>}
                {t.name}
              </span>
              <span className="font-mono text-xs font-bold text-success">R${(t.total || 0).toFixed(2)}</span>
            </div>
          </button>
        ))}
        {safeTables.length === 0 && (
          <div className="text-center text-muted text-[10px] font-bold uppercase py-8">Nenhuma comanda ativa</div>
        )}
      </div>
    </div>
  );
}
