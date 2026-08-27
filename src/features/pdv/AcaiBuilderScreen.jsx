import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useStore } from '../../store/useStore';
import AcaiBuilderModal from '../../components/organisms/AcaiBuilderModal.jsx';

export default function AcaiBuilderScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { catalog, addItemToActiveTable } = useStore();

  const passedProduct = location.state?.product || null;

  const safeCatalog = catalog || [];
  const acaiBases = useMemo(() => safeCatalog.filter(p => p.category === 'COPOS DE AÇAÍ'), [safeCatalog]);
  const availableAddons = useMemo(() => safeCatalog.filter(p => p.category === 'ADICIONAIS DOCES'), [safeCatalog]);

  const [builder, setBuilder] = useState(() => {
    if (passedProduct) {
      const defaults = passedProduct.ingredients ? passedProduct.ingredients.split(',').map(i => i.trim()).filter(Boolean) : [];
      return { base: passedProduct, standard: defaults, removals: [], extras: [], obs: '', quantity: 1, adjustment: 0 };
    }
    return { base: null, standard: [], removals: [], extras: [], obs: '', quantity: 1, adjustment: 0 };
  });

  const toggleRemoval = (ing) => setBuilder(prev => ({ ...prev, removals: prev.removals.includes(ing) ? prev.removals.filter(r => r !== ing) : [...prev.removals, ing] }));

  const updateExtraInBuilder = (addon, delta) => {
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
    navigate('/pdv');
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden p-6">
      <AcaiBuilderModal
        builder={builder}
        onClose={() => navigate('/pdv')}
        setBuilder={setBuilder}
        acaiBases={acaiBases}
        availableAddons={availableAddons}
        toggleRemoval={toggleRemoval}
        updateExtraInBuilder={updateExtraInBuilder}
        confirmFullBuild={confirmFullBuild}
      />
    </div>
  );
}
