import React from 'react';
import { ShoppingCart, FileText, Settings, X } from 'lucide-react';

/**
 * OrderSidebar - Sidebar de comandas (esquerda)
 * 
 * @param {Object} props
 * @param {Array} props.tables - Lista de mesas/comandas
 * @param {string|number} props.activeTableId - ID da mesa ativa
 * @param {Function} props.onSelectTable - Callback ao selecionar mesa
 * @param {Function} props.onNewTable - Callback ao clicar em nova comanda
 * @param {Function} props.onOpenReports - Callback ao abrir relatórios
 * @param {Function} props.onOpenSettings - Callback ao abrir configurações
 * @param {Function} props.onLogout - Callback ao sair
 */
export function OrderSidebar({
  tables = [],
  activeTableId,
  onSelectTable,
  onNewTable,
  onOpenReports,
  onOpenSettings,
  onLogout,
}) {
  return (
    <div className="w-64 shrink-0 bg-surface border-r border-border flex flex-col shadow-xl z-10">
      <div className="p-5 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-highlight rounded-full" />
          <span className="font-bold text-sm tracking-widest text-primary uppercase">
            TURBO PDV
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onOpenReports}
            className="p-1.5 hover:bg-surface-light rounded-md text-muted hover:text-primary transition-colors"
            title="Caixa e Relatórios"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-surface-light rounded-md text-muted hover:text-highlight transition-colors"
            title="Configurações"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 hover:bg-red-500/20 rounded-md text-muted hover:text-red-500 transition-colors"
            title="Sair"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTable(t.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${
              activeTableId === t.id
                ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10'
                : 'bg-surface border-border hover:border-primary/30 hover:bg-surface-light'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {t.isDelivery ? (
                  <ShoppingCart size={16} className="text-highlight" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
                <span className="font-bold text-xs text-primary uppercase tracking-wide">{t.name}</span>
              </div>
              {t.isDelivery && (
                <span className="text-[9px] font-bold text-highlight uppercase">Delivery</span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted">
                {t.items?.length || 0} {t.items?.length === 1 ? 'item' : 'itens'}
              </span>
              <span className="font-mono font-bold text-xs text-primary">
                R$ {(t.total || 0).toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={onNewTable}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-surface font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/30"
        >
          Nova Comanda
        </button>
      </div>
    </div>
  );
}