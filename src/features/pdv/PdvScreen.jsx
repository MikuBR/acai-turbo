import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import useToastStore from '../../store/toastStore';
import useLoadingStore from '../../store/loadingStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import { Search, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../components/atoms/ProductCard';

export default function PdvScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { catalog, setCatalog } = useStore();
  const catalogLog = logger.withScope('catalog');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Sincronizando dados...');
      Promise.all([
        ipc.invoke('catalog:get-products'),
        ipc.invoke('catalog:get-categories'),
      ]).then(([products, cats]) => {
        if (products?.success) { setCatalog(products.data || []); catalogLog.info('products loaded'); }
        else addToast('Erro ao carregar produtos', 'error');
        if (cats?.success) setCategories(cats.data || []);
        else addToast('Erro ao carregar categorias', 'error');
      }).finally(() => clearLoading());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeCatalog = catalog || [];

  const categoriesMenu = useMemo(() => {
    return ['TODOS', ...categories.map(c => c.name.toUpperCase())].filter(c => c !== 'ADICIONAIS DOCES');
  }, [categories]);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredProducts = useMemo(() => {
    return safeCatalog.filter(p => {
      const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
      const matchSearch = p.name?.toLowerCase().includes(deferredSearchTerm.toLowerCase());
      return matchCat && matchSearch && p.category !== 'ADICIONAIS DOCES';
    });
  }, [safeCatalog, selectedCategory, deferredSearchTerm]);

  const handleItemSelect = (p) => {
    if (p.category === 'COPOS DE AÇAÍ' || (p.ingredients && p.ingredients.length > 0)) {
      navigate('/pdv/builder/acai', { state: { product: p } });
    } else {
      navigate('/pdv/builder/quick', { state: { product: p } });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <div className="p-4 bg-surface border-b border-border flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input type="text" placeholder="Pesquisar..." className="w-full bg-surface-light border border-border p-2 pl-10 rounded-lg outline-none focus:border-primary transition-all text-sm select-text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {categoriesMenu.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${selectedCategory === c ? 'bg-primary border-primary-dark text-surface' : 'bg-surface-light border-border text-muted hover:text-primary'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(selectedCategory === 'TODOS' || selectedCategory.includes('AÇAÍ')) && (
            <button onClick={() => navigate('/pdv/builder/acai')} className="col-span-2 h-28 bg-gradient-to-br from-primary-dark to-primary p-5 rounded-xl border border-white/5 shadow-lg flex items-center justify-between group active:scale-95 transition-all">
              <div className="text-left">
                <span className="font-bold text-lg block text-white uppercase tracking-tight">Montagem</span>
                <span className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Personalizar Açaí</span>
              </div>
              <ChevronRight size={24} className="text-white opacity-50"/>
            </button>
          )}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center text-muted text-xs py-16">
              {searchTerm ? 'Nenhum produto encontrado para "' + searchTerm + '"' : 'Nenhum produto disponível'}
            </div>
          )}
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} onSelect={handleItemSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
