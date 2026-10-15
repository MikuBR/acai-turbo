import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '../../store/useStore'
import useToastStore from '../../store/toastStore'
import useLoadingStore from '../../store/loadingStore'
import { getIPC } from '../../services/ipc.js'
import logger from '../../services/logger.js'
import CheckoutModal from '../../components/organisms/CheckoutModal.tsx'
import { calculateDiscount } from '../../utils/promotion.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { enqueueOrder } from '../../services/offlineQueue'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'
import type { Table } from '../../types'

interface Payment {
  method: string
  amount: number
  exchangeFor?: string
}

interface Promotion {
  id: number
  name: string
  type: string
  value: number
  applies_to: string
  target_category?: string
  target_product_id?: number
  min_quantity: number
  start_date: string
  end_date: string
  is_active: boolean
}

interface CheckoutScreenProps {
  // No props needed - uses stores and hooks
}

export default function CheckoutScreen(_props: CheckoutScreenProps) {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { tables, activeTableId, checkoutActiveTable } = useStore();

  const orderLog = logger.withScope('orders');
  const cashLog = logger.withScope('cash');
  const { mark, measure } = usePerformanceMark();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const safeTables = tables || [];
  const FALLBACK_TABLE: Table = { id: 0, name: 'Selecione uma mesa', isDelivery: false, address: '', phone: '', items: [], total: 0 };
  const activeTable = useMemo(() => safeTables.find(t => t.id === activeTableId) || safeTables[0] || FALLBACK_TABLE, [safeTables, activeTableId]);

  useEffect(() => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('promotions:get').then((res: any) => {
        if (res?.success) setPromotions(res.data || []);
      });
    }
  }, []);

  const isOnline = useOnlineStatus();

  const handleFinalize = ({ payments, amountReceived }: { payments: Payment[]; amountReceived: string }) => {
    mark('checkout:start');
    const ipc = getIPC();

    const discount = selectedPromotion ? calculateDiscount(selectedPromotion, activeTable.total, activeTable.items || []) : 0;
    const finalTotal = activeTable.total - discount;
    if (finalTotal <= 0) {
      addToast('Total do pedido inválido', 'warning');
      mark('checkout:end');
      return;
    }

    const orderPayload = {
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
    };

    // Offline: salva na fila local
    if (!isOnline) {
      enqueueOrder(orderPayload);
      addToast('Sem conexão — pedido salvo na fila local', 'warning');
      orderLog.info('order queued offline', { table: activeTable.name, total: finalTotal });
      checkoutActiveTable();
      setSelectedPromotion(null);
      mark('checkout:end');
      const duration = measure('checkout:start', 'checkout:end');
      if (duration !== null) {
        orderLog.info('checkout duration (offline)', { durationMs: duration });
      }
      navigate('/pdv');
      return;
    }

    // Online: envia direto para o backend
    if (!ipc) return;
    setLoading('Finalizando pedido...');

    ipc.invoke('orders:save', orderPayload).then((res: any) => {
      if (res && res.success) {
        addToast('Pedido finalizado com sucesso!', 'success');
        orderLog.info('order checked out', { table: activeTable.name, total: finalTotal });
        cashLog.info('payment registered', { payments });
        checkoutActiveTable();
        setSelectedPromotion(null);
        mark('checkout:end');
        const duration = measure('checkout:start', 'checkout:end');
        if (duration !== null) {
          orderLog.info('checkout duration', { durationMs: duration });
        }
        navigate('/pdv');
      } else {
        addToast(res?.error || 'Erro ao finalizar pedido', 'error');
        mark('checkout:end');
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
      setSelectedPromotion={setSelectedPromotion as React.Dispatch<React.SetStateAction<Promotion | null>>}
      calculateDiscount={calculateDiscount}
      onFinalize={handleFinalize as (data: { payments: Payment[]; amountReceived: string }) => void}
    />
  );
}
