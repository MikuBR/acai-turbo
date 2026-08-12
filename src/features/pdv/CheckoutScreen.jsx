import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import useToastStore from '../../store/toastStore';
import useLoadingStore from '../../store/loadingStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import CheckoutModal from '../../components/organisms/CheckoutModal.jsx';

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { tables, activeTableId, checkoutActiveTable } = useStore();

  const orderLog = logger.withScope('orders');
  const cashLog = logger.withScope('cash');

  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const safeTables = tables || [];
  const activeTable = useMemo(() => safeTables.find(t => t.id === activeTableId) || safeTables[0] || { id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }, [safeTables, activeTableId]);

  useEffect(() => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('promotions:get').then(res => {
        if (res?.success) setPromotions(res.data || []);
      });
    }
  }, []);

  const calculateDiscount = (promo, total) => {
    if (!promo) return 0;
    if (promo.type === 'PERCENTAGE') {
      return total * (promo.value / 100);
    } else if (promo.type === 'FIXED_AMOUNT') {
      return Math.min(promo.value, total);
    }
    return 0;
  };

  const handleFinalize = ({ payments, amountReceived }) => {
    const ipc = getIPC();
    if (!ipc) return;

    const discount = selectedPromotion ? calculateDiscount(selectedPromotion, activeTable.total) : 0;
    const finalTotal = activeTable.total - discount;
    setLoading('Finalizando pedido...');

    ipc.invoke('orders:save', {
      orderData: {
        tableName: activeTable.name,
        total: finalTotal,
        originalTotal: activeTable.total,
        discount: discount,
        promotionId: selectedPromotion?.id || null,
        promotionName: selectedPromotion?.name || null,
        payments,
        amountReceived: Number(amountReceived) || 0,
        isDelivery: activeTable.isDelivery,
        address: activeTable.address,
        phone: activeTable.phone
      },
      items: activeTable.items || []
    }).then(res => {
      if (res && res.success) {
        addToast('Pedido finalizado com sucesso!', 'success');
        orderLog.info('order checked out', { table: activeTable.name, total: finalTotal });
        cashLog.info('payment registered', { payments });
        checkoutActiveTable();
        setSelectedPromotion(null);
        navigate('/pdv');
      } else {
        addToast(res?.error || 'Erro ao finalizar pedido', 'error');
      }
    }).finally(() => clearLoading());
  };

  return (
    <CheckoutModal
      isOpen={true}
      onClose={() => navigate('/pdv')}
      activeTable={activeTable}
      promotions={promotions}
      selectedPromotion={selectedPromotion}
      setSelectedPromotion={setSelectedPromotion}
      calculateDiscount={calculateDiscount}
      onFinalize={handleFinalize}
    />
  );
}
