import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import useToastStore from '../../store/toastStore';
import useLoadingStore from '../../store/loadingStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import CheckoutModal from '../../components/organisms/CheckoutModal.jsx';
import { calculateDiscount } from '../../utils/promotion.js';

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
  const FALLBACK_TABLE = { id: null, name: 'Selecione uma mesa', isDelivery: false, address: '', phone: '', items: [], total: 0 };
  const activeTable = useMemo(() => safeTables.find(t => t.id === activeTableId) || safeTables[0] || FALLBACK_TABLE, [safeTables, activeTableId]);

  useEffect(() => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('promotions:get').then(res => {
        if (res?.success) setPromotions(res.data || []);
      });
    }
  }, []);

  const handleFinalize = ({ payments, amountReceived }) => {
    const ipc = getIPC();
    if (!ipc) return;

    const discount = selectedPromotion ? calculateDiscount(selectedPromotion, activeTable.total, activeTable.items || []) : 0;
    const finalTotal = activeTable.total - discount;
    if (finalTotal <= 0) {
      addToast('Total do pedido inválido', 'warning');
      return;
    }
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
