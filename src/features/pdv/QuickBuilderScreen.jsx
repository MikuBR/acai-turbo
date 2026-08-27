import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useStore } from '../../store/useStore';
import QuickBuilderModal from '../../components/organisms/QuickBuilderModal.jsx';

export default function QuickBuilderScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItemToActiveTable } = useStore();

  const passedProduct = location.state?.product || null;

  const [simpleBuilder, setSimpleBuilder] = useState(() => {
    if (passedProduct) {
      return { product: passedProduct, quantity: 1, obs: '', adjustment: 0 };
    }
    return null;
  });

  const confirmSimpleBuild = () => {
    if (!simpleBuilder?.product) return;
    const rawAdjustment = parseFloat(simpleBuilder.adjustment);
    const safeAdjustment = isNaN(rawAdjustment) ? 0 : rawAdjustment;
    const unitPrice = Math.max(0, simpleBuilder.product.price + safeAdjustment);
    addItemToActiveTable({ ...simpleBuilder.product, name: `${simpleBuilder.quantity > 1 ? simpleBuilder.quantity + 'x ' : ''}${simpleBuilder.product.name}`, price: unitPrice * simpleBuilder.quantity, notes: simpleBuilder.obs + (safeAdjustment != 0 ? ` | ADJ: R$ ${safeAdjustment}` : ''), category: simpleBuilder.product.category });
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
        setBuilder={setSimpleBuilder}
        confirmSimpleBuild={confirmSimpleBuild}
      />
    </div>
  );
}
