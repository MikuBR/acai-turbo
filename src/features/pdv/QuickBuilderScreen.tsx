import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useStore } from '../../store/useStore'
import QuickBuilderModal from '../../components/organisms/QuickBuilderModal.tsx'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'
import type { Product } from '../../types'

interface Builder {
  product: Product
  quantity: number
  adjustment: string
  obs: string
}

export default function QuickBuilderScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItemToActiveTable } = useStore();
  const { mark, measure } = usePerformanceMark();

  const passedProduct = (location.state as any)?.product || null;

  const [simpleBuilder, setSimpleBuilder] = useState<Builder | null>(() => {
    if (passedProduct) {
      return { product: passedProduct, quantity: 1, adjustment: '0', obs: '' };
    }
    return null;
  });

  const confirmSimpleBuild = () => {
    if (!simpleBuilder?.product) return;
    mark('quick-builder:confirm:start');
    const rawAdjustment = parseFloat(simpleBuilder.adjustment);
    const safeAdjustment = isNaN(rawAdjustment) ? 0 : rawAdjustment;
    const unitPrice = Math.max(0, simpleBuilder.product.price + safeAdjustment);
    addItemToActiveTable({ ...simpleBuilder.product, name: `${simpleBuilder.quantity > 1 ? simpleBuilder.quantity + 'x ' : ''}${simpleBuilder.product.name}`, price: unitPrice * simpleBuilder.quantity, notes: simpleBuilder.obs + (safeAdjustment != 0 ? ` | ADJ: R$ ${safeAdjustment}` : ''), category: simpleBuilder.product.category });
    mark('quick-builder:confirm:end');
    const duration = measure('quick-builder:confirm:start', 'quick-builder:confirm:end');
    if (duration !== null) {
      console.log('[quick-builder] confirm duration:', duration, 'ms');
    }
    navigate('/pdv');
  };

  if (!simpleBuilder) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface p-6">
        <div className="text-center">
          <p className="text-muted text-sm mb-4">Nenhum produto selecionado.</p>
          <button onClick={() => navigate('/pdv')} className="px-4 py-2 bg-primary text-surface rounded-lg text-xs font-bold uppercase">Voltar ao PDV</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden p-6">
      <QuickBuilderModal
        builder={simpleBuilder}
        onClose={() => navigate('/pdv')}
        setBuilder={setSimpleBuilder as any}
        confirmSimpleBuild={confirmSimpleBuild}
      />
    </div>
  );
}
