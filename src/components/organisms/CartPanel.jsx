import React from 'react';
import { ShoppingCart } from 'lucide-react';

/**
 * CartPanel - Painel de resumo do carrinho (direita)
 * 
 * @param {Object} props
 * @param {Object} props.activeTable - Mesa ativa com { name, items, total, isDelivery }
 * @param {Function} props.onRemoveItem - Callback ao remover item (recebe index)
 * @param {Function} props.onCheckout - Callback ao finalizar venda
 */
export function CartPanel({ activeTable, onRemoveItem, onCheckout }) {
  const items = activeTable?.items || [];
  const total = activeTable?.total || 0;

  return (
    <div className="w-80 shrink-0 bg-surface border-l border-border flex flex-col shadow-2xl z-10">
      <div className="p-5 border-b border-border font-bold flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
          <ShoppingCart size={14} /> RESUMO
        </div>
        {activeTable?.isDelivery ? (
          <span className="text-[9px] bg-highlight/20 px-2 py-0.5 rounded font-bold text-highlight uppercase">
            DELIVERY
          </span>
        ) : (
          <span className="text-[9px] bg-surface-light px-2 py-0.5 rounded font-bold text-primary uppercase">
            {activeTable?.name}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {items.length === 0 && (
          <div className="text-center text-muted text-xs mt-8">
            Nenhum item adicionado
          </div>
        )}
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${
              item.category === 'TAXA'
                ? 'bg-highlight/10 border-highlight/30'
                : 'bg-surface-light border-border'
            }`}
          >
            <div className="flex justify-between font-bold text-[11px] mb-1">
              <span className="flex-1 pr-2 uppercase text-primary leading-tight">
                {item.name}
              </span>
              <span
                className={`font-mono ${
                  item.category === 'TAXA' ? 'text-highlight' : 'text-primary'
                }`}
              >
                R${(item.price || 0).toFixed(2)}
              </span>
            </div>
            {item.notes && (
              <div className="text-[9px] text-muted mt-1 line-clamp-2">
                {item.notes}
              </div>
            )}
            <button
              onClick={() => onRemoveItem(idx)}
              className="mt-2 text-[9px] text-red-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-border space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Total</span>
          <span className="font-mono font-bold text-xl text-primary">
            R$ {total.toFixed(2)}
          </span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-surface font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finalizar
        </button>
      </div>
    </div>
  );
}