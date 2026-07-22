import React from 'react';
import { Plus } from 'lucide-react';

/**
 * ProductCard - Card de produto no catálogo
 * 
 * @param {Object} product - { id, name, price, category }
 * @param {Function} onSelect - Callback ao clicar no produto
 */
export function ProductCard({ product, onSelect }) {
  if (!product) return null;

  return (
    <button
      onClick={() => onSelect?.(product)}
      className="bg-surface border border-border p-4 rounded-xl hover:border-primary transition-all flex flex-col justify-between min-h-[8rem] h-full text-left shadow-sm active:scale-[0.98] group"
    >
      <div className="space-y-1 pb-2">
        <div className="text-[8px] text-muted font-bold uppercase tracking-wider">
          {product.category}
        </div>
        <span className="font-bold text-xs text-primary group-hover:text-primary-dark leading-tight uppercase block">
          {product.name}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
        <span className="font-mono font-bold text-sm text-primary">
          R${(product.price || 0).toFixed(2)}
        </span>
        <div className="p-1 bg-surface-light rounded-lg group-hover:bg-primary transition-colors text-muted group-hover:text-surface">
          <Plus size={14} />
        </div>
      </div>
    </button>
  );
}