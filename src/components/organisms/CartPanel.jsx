import { memo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

const IFOOD_STATUS_FLOW = [
  { action: 'startPreparation', label: 'Iniciar Preparo', icon: '🍳', color: 'amber' },
  { action: 'readyToPickup', label: 'Pronto p/ Retirada', icon: '✅', color: 'success' },
  { action: 'dispatch', label: 'Saiu p/ Entrega', icon: '🛵', color: 'info' },
];

/**
 * CartPanel - Painel de resumo do carrinho (direita)
 * 
 * @param {Object} props
 * @param {Object} props.activeTable - Mesa ativa com { name, items, total, isDelivery }
 * @param {Function} props.onRemoveItem - Callback ao remover item (recebe index)
 * @param {Function} props.onCheckout - Callback ao finalizar venda
 * @param {string|null} props.ifoodOrderId - ID do pedido iFood (se for de delivery iFood)
 * @param {Function} props.onIfoodAction - Callback ao clicar em acao iFood (recebe action, orderId)
 */
export const CartPanel = memo(function CartPanel({ activeTable, onRemoveItem, onCheckout, ifoodOrderId = null, onIfoodAction = null }) {
  const items = activeTable?.items || [];
  const total = activeTable?.total || 0;
  const isIfood = !!ifoodOrderId;
  const [actionLoading, setActionLoading] = useState(null);

  const handleIfoodAction = async (action) => {
    if (actionLoading) return;
    setActionLoading(action);
    try {
      if (onIfoodAction) await onIfoodAction(action, ifoodOrderId);
    } finally {
      setActionLoading(null);
    }
  };

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
              className="mt-2 text-[9px] text-danger/80 hover:text-danger font-bold uppercase tracking-wider transition-colors"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-border space-y-3">
        {isIfood && (
          <div className="space-y-2 pb-2 border-b border-border">
            {IFOOD_STATUS_FLOW.map(({ action, label, icon, color }) => (
              <button
                key={action}
                onClick={() => handleIfoodAction(action)}
                disabled={actionLoading !== null}
                className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionLoading === action
                    ? 'opacity-60 cursor-wait'
                    : 'hover:scale-[1.02] active:scale-95'
                } ${
                  color === 'amber'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 hover:bg-amber-500/25'
                    : color === 'success'
                    ? 'bg-success/15 border border-success/30 text-success hover:bg-success/25'
                    : 'bg-info/15 border border-info/30 text-info hover:bg-info/25'
                }`}
              >
                {actionLoading === action ? (
                  <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{icon}</span>
                )}
                {actionLoading === action ? 'Processando...' : label}
              </button>
            ))}
          </div>
        )}
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
});