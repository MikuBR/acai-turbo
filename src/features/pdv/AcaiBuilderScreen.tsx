import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useStore } from '../../store/useStore'
import AcaiBuilderModal from '../../components/organisms/AcaiBuilderModal.tsx'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'
import type { Product } from '../../types'

interface AcaiBase {
  id: number
  name: string
  price: number
  category: string
  ingredients?: string
}

interface Extra {
  id: number
  name: string
  price: number
  qty: number
}

interface Builder {
  base: AcaiBase | null
  standard: string[]
  removals: string[]
  extras: Extra[]
  obs: string
  adjustment: string
  quantity: number
}

export default function AcaiBuilderScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { catalog, addItemToActiveTable } = useStore();
  const { mark, measure } = usePerformanceMark();

  const passedProduct = (location.state as any)?.product || null;

  const [builder, setBuilder] = useState<Builder>(() => {
    if (passedProduct) {
      const defaults = passedProduct.ingredients ? passedProduct.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean) : [];
      return { base: passedProduct, standard: defaults, removals: [], extras: [], obs: '', quantity: 1, adjustment: '0' };
    }
    return { base: null, standard: [], removals: [], extras: [], obs: '', quantity: 1, adjustment: '0' };
  });

  const acaiBases = useMemo(() => (catalog || []).filter((p: Product) => p.category === 'COPOS DE AÇAÍ'), [catalog]);
  const availableAddons = useMemo(() => (catalog || []).filter((p: Product) => p.category === 'ADICIONAIS DOCES'), [catalog]);
  const blockedIngredients = useMemo(() => (catalog || []).filter((p: Product) => /bebida/i.test(p.category)).map((p: Product) => p.name.toLowerCase()), [catalog]);
  const removableItems = useMemo(() => (catalog || []).filter((p: Product) => p.category === 'RETIRADAS'), [catalog]);

  if (acaiBases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface text-muted">
        <div className="text-center p-8 max-w-md">
          <span className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-danger">Aviso</span>
          <p className="text-sm">Nenhuma base de açaí no catálogo. Adicione um produto na categoria COPOS DE AÇAÍ para começar.</p>
        </div>
      </div>
    );
  }

  const toggleRemoval = (ing: string) => setBuilder(prev => ({ ...prev, removals: prev.removals.includes(ing) ? prev.removals.filter(r => r !== ing) : [...prev.removals, ing] }));

  const updateExtraInBuilder = (addon: Product, delta: number) => {
    setBuilder(prev => {
      const existing = prev.extras.find(e => e.id === addon.id);
      let newExtras = existing
        ? prev.extras.map(e => e.id === addon.id ? { ...e, qty: Math.max(0, e.qty + delta) } : e).filter(e => e.qty > 0)
        : (delta > 0 ? [...prev.extras, { ...addon, qty: 1 }] : prev.extras);
      return { ...prev, extras: newExtras };
    });
  };

  const confirmFullBuild = () => {
    if (!builder?.base) return;
    mark('acai-builder:confirm:start');
    const extrasPrice = builder.extras.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const rawAdjustment = parseFloat(builder.adjustment);
    const safeAdjustment = isNaN(rawAdjustment) ? 0 : rawAdjustment;
    const unitPrice = Math.max(0, builder.base.price + extrasPrice + safeAdjustment);
    const notes = [
      builder.removals.length > 0 ? `SEM: ${builder.removals.join(', ')}` : '',
      builder.extras.length > 0 ? `ADD: ${builder.extras.map(e => `${e.qty}x ${e.name}`).join(', ')}` : '',
      builder.obs ? `OBS: ${builder.obs}` : '',
      safeAdjustment != 0 ? `ADJ: R$ ${safeAdjustment}` : ''
    ].filter(Boolean).join(' | ');

    addItemToActiveTable({ ...builder.base, name: `${builder.quantity > 1 ? builder.quantity + 'x ' : ''}${builder.base.name}`, price: unitPrice * builder.quantity, notes, category: builder.base.category });
    mark('acai-builder:confirm:end');
    const duration = measure('acai-builder:confirm:start', 'acai-builder:confirm:end');
    if (duration !== null) {
      console.log('[acai-builder] confirm duration:', duration, 'ms');
    }
    navigate('/pdv');
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden p-6">
      <AcaiBuilderModal
        builder={builder}
        onClose={() => navigate('/pdv')}
        setBuilder={setBuilder as any}
        acaiBases={acaiBases}
        availableAddons={availableAddons}
        blockedIngredients={blockedIngredients}
        removableItems={removableItems}
        toggleRemoval={toggleRemoval}
        updateExtraInBuilder={updateExtraInBuilder}
        confirmFullBuild={confirmFullBuild}
      />
    </div>
  );
}
