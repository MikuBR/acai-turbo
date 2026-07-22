import React from 'react';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { ProductCard } from '../atoms/ProductCard';

/**
 * CatalogPanel - Área central de catálogo de produtos
 * 
 * @param {Object} props
 * @param {Array} props.products - Lista de produtos
 * @param {Array} props.categories - Lista de categorias
 * @param {string} props.searchTerm - Termo de busca
 * @param {string} props.selectedCategory - Categoria selecionada
 * @param {Function} props.onSearchChange - Callback ao mudar busca
 * @param {Function} props.onCategoryChange - Callback ao mudar categoria
 * @param {Function} props.onProductSelect - Callback ao selecionar produto
 * @param {Function} props.onCustomBuild - Callback ao clicar em montagem personalizada
 */
export function CatalogPanel({
  products = [],
  categories = [],
  searchTerm = '',
  selectedCategory = 'TODOS',
  onSearchChange,
  onCategoryChange,
  onProductSelect,
  onCustomBuild,
}) {
  const categoriesMenu = ['TODOS', ...categories.map((c) => c.name.toUpperCase())].filter(
    (c) => c !== 'ADICIONAIS DOCES'
  );

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch && p.category !== 'ADICIONAIS DOCES';
  });

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <div className="p-4 bg-surface border-b border-border flex flex-col gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={16}
          />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full bg-surface-light border border-border p-2 pl-10 rounded-lg outline-none focus:border-primary transition-all text-sm select-text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {categoriesMenu.map((c) => (
            <button
              key={c}
              onClick={() => onCategoryChange?.(c)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                selectedCategory === c
                  ? 'bg-primary border-primary-dark text-surface'
                  : 'bg-surface-light border-border text-muted hover:text-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={() => onProductSelect?.(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}