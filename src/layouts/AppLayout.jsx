import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/authStore';
import useToastStore from '../store/toastStore';
import useLoadingStore from '../store/loadingStore';
import { getIPC } from '../services/ipc.js';
import logger from '../services/logger.js';
import { OrderSidebar } from '../components/organisms/OrderSidebar.jsx';
import { CartPanel } from '../components/organisms/CartPanel.jsx';
import ManagerAuthModal from '../components/organisms/ManagerAuthModal.jsx';
import CashModal from '../components/organisms/CashModal.jsx';
import ToastContainer from '../components/atoms/Toast';
import LoadingOverlay from '../components/atoms/LoadingOverlay';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* silent */ }
}

export default function AppLayout() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { currentUser, authToken, setAuthTime, isAuthValid, logout: storeLogout } = useAuthStore();

  const { tables, activeTableId, setActiveTable, addTable, addItemToActiveTable, removeItemFromActiveTable, setCatalog } = useStore();

  const catalogLog = logger.withScope('catalog');
  const ifoodLog = logger.withScope('ifood');

  // iFood states needed for sidebar display
  const [ifoodConfig, setIfoodConfig] = useState({ clientId: '', clientSecret: '', merchantId: '', enabled: false });
  const [ifoodUnreadCount, setIfoodUnreadCount] = useState(0);
  const [showPassModal, setShowPassModal] = useState({ show: false, onResult: null });
  const [showCashModal, setShowCashModal] = useState(false);

  const { activeTable, safeTables } = useMemo(() => {
    const safeTables = tables || [];
    const FALLBACK_TABLE = { id: null, name: 'Selecione uma mesa', isDelivery: false, address: '', phone: '', items: [], total: 0 };
    const activeTable = safeTables.find(t => t.id === activeTableId) || safeTables[0] || FALLBACK_TABLE;
    return { activeTable, safeTables };
  }, [tables, activeTableId]);

  // Bootstrap: load initial data on mount
  useEffect(() => {
    localStorage.removeItem('authToken');
    const ipc = getIPC();
    if (!ipc) return;

    // Sync catalog
    setLoading('Sincronizando dados...');
    Promise.all([
      ipc.invoke('catalog:get-products'),
      ipc.invoke('catalog:get-categories'),
      ipc.invoke('promotions:get'),
    ]).then(([products, categories, promotions]) => {
      if (products?.success) { setCatalog(products.data || []); catalogLog.info('products loaded'); }
      else addToast('Erro ao carregar produtos', 'error');
      if (categories?.success) { /* categories handled by each screen */ }
      if (promotions?.success) { /* promotions handled by each screen */ }
    }).finally(() => clearLoading());

    // Printer config
    ipc.invoke('config:get-all').then(res => {
      if (res?.success) {
        const configs = res.data || [];
        const getCfg = (key, def) => { const c = configs.find(x => x.key === key); return c ? c.value : def; };
        const clientId = getCfg('ifood_client_id', '');
        const clientSecret = getCfg('ifood_client_secret', '');
        const merchantId = getCfg('ifood_merchant_id', '');
        const enabled = !!(clientId && clientSecret && merchantId);
        setIfoodConfig({ clientId, clientSecret, merchantId, enabled });
        if (enabled) {
          ipc.invoke('ifood:start-polling', { clientId, clientSecret, merchantId, enabled });
        }
      }
    });
  }, []);

  // iFood push event listeners (main → renderer)
  useEffect(() => {
    const ipc = getIPC();
    if (!ipc) return;

    const handleNewOrder = (orderData) => {
      const order = orderData.orderData;
      const customer = order.customer || {};
      const addr = order.deliveryAddress || {};
      const tableName = `iFood #${orderData.displayId} - ${(customer.name || 'Cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()}`;
      const address = [addr.streetName, addr.streetNumber, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(', ') || 'Endereço não informado';
      const phone = customer.phone?.number || '(11) 99999-9999';

      addTable({
        name: tableName,
        isDelivery: true,
        phone,
        address,
        ifoodOrderId: orderData.orderId,
      });

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = Math.max(1, item.quantity || 1);
          const price = Math.max(0, item.unitPrice || item.totalPrice / qty || 0);
          for (let q = 0; q < qty; q++) {
            addItemToActiveTable({
              name: item.name || `Item #${item.id || q}`,
              price,
              category: 'iFOOD',
              notes: (item.options && Array.isArray(item.options))
                ? item.options.map(o => o.name || '').filter(Boolean).join(', ')
                : '',
            });
          }
        });
      }

      const total = order.totalPrice || 0;
      addToast(`🛵 Novo pedido iFood: ${customer.name || 'Cliente'} - R$ ${total.toFixed(2)}`, 'success');
      playBeep();
      setIfoodUnreadCount(c => c + 1);
    };

    const handleCancelled = ({ reason }) => {
      addToast(`❌ Pedido iFood cancelado: ${reason || 'Motivo não informado'}`, 'error');
    };

    ipc.on('ifood:new-order', handleNewOrder);
    ipc.on('ifood:order-cancelled', handleCancelled);

    return () => {
      ipc.removeListener('ifood:new-order', handleNewOrder);
      ipc.removeListener('ifood:order-cancelled', handleCancelled);
    };
  }, []);

  const handleLogout = async () => {
    const ipc = getIPC();
    if (ipc && authToken && currentUser) {
      await ipc.invoke('auth:logout', { token: authToken, userId: currentUser.id });
    }
    storeLogout();
    navigate('/login');
  };

  const handleIfoodAction = async (action, orderId) => {
    const ipc = getIPC();
    if (!ipc) { addToast('Sem conexão com o sistema', 'error'); return; }
    const channel = `ifood:${action}`;
    try {
      const res = await ipc.invoke(channel, { orderId });
      if (res?.success) {
        const label = { startPreparation: 'Preparo iniciado', readyToPickup: 'Pronto para retirada', dispatch: 'Saiu para entrega' };
        addToast(`✅ Pedido iFood: ${label[action] || action}`, 'success');
        ifoodLog.info('ifood action', { action });
      } else {
        addToast(`❌ ${res?.error || `Erro ao executar ${action}`}`, 'error');
      }
    } catch {
      addToast(`❌ Erro ao executar ${action}`, 'error');
    }
  };

  const runWithManagerAuth = (action) => {
    if (isAuthValid()) action();
    else {
      setShowPassModal({ show: true, onResult: action });
    }
  };

  return (
    <div className="flex h-screen bg-surface text-primary font-sans overflow-hidden select-none">
      {/* 1. SIDEBAR - COMANDAS */}
      <OrderSidebar
        tables={safeTables}
        activeTableId={activeTableId}
        onSelectTable={(id) => { if (ifoodUnreadCount > 0) setIfoodUnreadCount(0); setActiveTable(id); }}
        onNewTable={() => navigate('/pdv/new-table')}
        onOpenReports={() => navigate('/reports')}
        onOpenSettings={() => runWithManagerAuth(() => navigate('/settings'))}
        onOpenCash={() => runWithManagerAuth(() => setShowCashModal(true))}
        onLogout={handleLogout}
        ifoodConnected={!!ifoodConfig.enabled}
        ifoodUnreadCount={ifoodUnreadCount}
      />

      {/* 2. CENTRAL CONTENT (child route via Outlet) */}
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <Outlet />
      </div>

      {/* 3. CARRINHO DIREITA */}
      <CartPanel
        activeTable={activeTable}
        onRemoveItem={removeItemFromActiveTable}
        onCheckout={() => navigate('/checkout')}
        ifoodOrderId={activeTable?.ifoodOrderId || null}
        onIfoodAction={handleIfoodAction}
      />

      {/* Toasts + Loading overlay */}
      <ToastContainer />
      <LoadingOverlay />

      {/* --- MODAIS --- */}

      {showPassModal.show && (
        <ManagerAuthModal
          show={showPassModal.show}
          onCancel={() => setShowPassModal({ show: false, onResult: null })}
          onSuccess={() => { setAuthTime(Date.now()); showPassModal.onResult?.(); setShowPassModal({ show: false, onResult: null }); }}
          ipcGet={getIPC}
        />
      )}

      {showCashModal && (
        <CashModal
          isOpen={showCashModal}
          onClose={() => setShowCashModal(false)}
          getIPC={getIPC}
        />
      )}
    </div>
  );
}
