import React from 'react';
import { FileText, Settings, X } from 'lucide-react';

export default function Sidebar({ safeTables, activeTableId, setActiveTable, onReportsClick, onSettingsClick, handleLogout }) {
  const activeTable = safeTables.find(t => t.id === activeTableId) || safeTables[0] || null;

  return (
    <div className="w-64 shrink-0 bg-white border-r border-gray-300 flex flex-col shadow-xl z-10">
      <div className="p-5 border-b border-gray-300 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
          <span className="font-bold text-sm tracking-widest text-gray-900 uppercase">TURBO PDV</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onReportsClick} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 hover:text-emerald-500 transition-colors" title="Caixa e Relatórios">
            <FileText size={18}/>
          </button>
          <button onClick={onSettingsClick} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-900 transition-colors" title="Configurações">
            <Settings size={18}/>
          </button>
          <button onClick={handleLogout} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-colors" title="Sair">
            <X size={18}/>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {safeTables.map(t => (
          <button key={t.id} onClick={() => setActiveTable(t.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
              activeTableId === t.id ? 'bg-emerald-600/10 border-emerald-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-200/40'
            }`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold text-xs uppercase tracking-tight truncate pr-2 ${
                activeTableId === t.id ? 'text-emerald-400' : 'text-gray-600'
              }`}>
                {t.isDelivery && <span className="mr-1">🛵</span>}
                {t.name}
              </span>
              <span className="font-mono text-xs font-bold text-emerald-500">R${(t.total || 0).toFixed(2)}</span>
            </div>
          </button>
        ))}
        {safeTables.length === 0 && (
          <div className="text-center text-gray-400 text-[10px] font-bold uppercase py-8">Nenhuma comanda ativa</div>
        )}
      </div>
    </div>
  );
}
