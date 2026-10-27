import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Outlet } from 'react-router'
import { Moon, Sun, RefreshCw } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import useToastStore from '../store/toastStore'
import useLoadingStore from '../store/loadingStore'
import { getIPC } from '../services/ipc.js'
import { getProducts } from '../services/productCache.js'
import logger from '../services/logger.js'
import { OrderSidebar } from '../components/organisms/OrderSidebar.tsx'
import { CartPanel } from '../components/organisms/CartPanel.tsx'
import ManagerAuthModal from '../components/organisms/ManagerAuthModal.tsx'
import CashModal from '../components/organisms/CashModal.tsx'
import ToastContainer from '../components/atoms/Toast'
import LoadingOverlay from '../components/atoms/LoadingOverlay'
import { UpdateManager } from '../components/organisms/UpdateManager.tsx'
import { ConnectionIndicator } from '../components/atoms/ConnectionIndicator'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { getPendingCount, syncPendingOrders } from '../services/offlineQueue'
import { useTheme } from '../hooks/useTheme'
import { usePerformanceMark } from '../hooks/usePerformanceMark'
import { usePreloadRoute } from '../hooks/usePreloadRoute.js'
import type { IfoodConfig, Table } from '../types'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  const { currentUser, setAuthTime, isAuthValid, logout: storeLogout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { mark, measure } = usePerformanceMark();

  const { tables, activeTableId, setActiveTable, addTable, addItemToActiveTable, removeItemFromActiveTable, setCatalog, deleteTable } = useStore();

  const catalogLog = logger.withScope('catalog');
  const ifoodLog = logger.withScope('ifood');

  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());

  // Preload de rotas prioritárias via idle detection
  // PDV e Checkout já são preloadados no entry point, então aqui
  // focamos em rotas secundárias que também são acessadas frequentemente
  usePreloadRoute([
    '../features/settings/SettingsScreen.tsx',
    '../features/reports/ReportsScreen.tsx',
    '../features/pdv/AcaiBuilderScreen.tsx',
    '../features/pdv/QuickBuilderScreen.tsx',
  ], { idleDelay: 3000, enabled: true });

  useEffect(() => {
    if (!isOnline) return;
    const pending = getPendingCount();
    if (pending === 0) return;

    const ipc = getIPC();
    if (!ipc) return;

    addToast(`Sincronizando ${pending} pedido(s) pendente(s)...`, 'info');
    syncPendingOrders(ipc.invoke.bind(ipc)).then(({ synced, failed }) => {
      setPendingCount(getPendingCount());
      if (synced > 0) {
        addToast(`${synced} pedido(s) sincronizado(s) com sucesso!`, 'success');
      }
      if (failed > 0) {
        addToast(`${failed} pedido(s) falharam ao sincronizar`, 'warning');
      }
    });
  }, [isOnline]);

  const [ifoodConfig, setIfoodConfig] = useState<IfoodConfig>({ clientId: '', clientSecret: '', merchantId: '', enabled: false });
  const [ifoodUnreadCount, setIfoodUnreadCount] = useState(0);
  const [showPassModal, setShowPassModal] = useState<{ show: boolean; onResult: (() => void) | null }>({ show: false, onResult: null });
  const [showCashModal, setShowCashModal] = useState(false);

  const { activeTable, safeTables } = useMemo(() => {
    const safeTables = tables || [];
    const FALLBACK_TABLE: Table = { id: 0, name: 'Selecione uma mesa', isDelivery: false, address: '', phone: '', items: [], total: 0 };
    const activeTable = safeTables.find(t => t.id === activeTableId) || safeTables[0] || FALLBACK_TABLE;
    return { activeTable, safeTables };
  }, [tables, activeTableId]);

  useEffect(() => {
    mark('app:bootstrap:start');
    const ipc = getIPC();
    if (!ipc) return;

    setLoading('Sincronizando dados...');
    Promise.all([
      getProducts(),
      ipc.invoke('catalog:get-categories'),
      ipc.invoke('promotions:get'),
    ]).then(([products, categories, promotions]) => {
      if (products.length > 0) { setCatalog(products); catalogLog.info('products loaded (cache)'); }
      else addToast('Erro ao carregar produtos', 'error');
      if (categories?.success) { /* categories handled by each screen */ }
      if (promotions?.success) { /* promotions handled by each screen */ }
    }).finally(() => clearLoading());

    ipc.invoke('config:get-all').then((res: any) => {
      if (res?.success) {
        const configs = res.data || [];
        const getCfg = (key: string, def: string) => { const c = configs.find((x: any) => x.key === key); return c ? c.value : def; };
        const clientId = getCfg('ifood_client_id', '');
        const clientSecret = getCfg('ifood_client_secret', '');
        const merchantId = getCfg('ifood_merchant_id', '');
        const enabled = !!(clientId && clientSecret && merchantId);
        setIfoodConfig({ clientId, clientSecret, merchantId, enabled });
        if (enabled) {
          ipc.invoke('ifood:start-polling', { clientId, clientSecret, merchantId, enabled });
        }
      }
      mark('app:bootstrap:end');
      const duration = measure('app:bootstrap:start', 'app:bootstrap:end');
      if (duration !== null) {
        catalogLog.info('app bootstrap duration', { durationMs: duration });
      }
    });
  }, []);

  useEffect(() => {
    const ipc = getIPC();
    if (!ipc) return;

    const handleNewOrder = (orderData: any) => {
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
      } as any);

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const qty = Math.max(1, item.quantity || 1);
          const price = Math.max(0, item.unitPrice || item.totalPrice / qty || 0);
          for (let q = 0; q < qty; q++) {
            addItemToActiveTable({
              id: 0,
              name: item.name || `Item #${item.id || q}`,
              price,
              category: 'iFOOD',
              notes: (item.options && Array.isArray(item.options))
                ? item.options.map((o: any) => o.name || '').filter(Boolean).join(', ')
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

    const handleCancelled = ({ reason }: { reason: string }) => {
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
    if (ipc && currentUser) {
      await ipc.invoke('auth:logout', { userId: currentUser.id });
    }
    storeLogout();
    navigate('/login');
  };

  const handleIfoodAction = async (action: string, orderId: string) => {
    const ipc = getIPC();
    if (!ipc) { addToast('Sem conexão com o sistema', 'error'); return; }
    const channel = `ifood:${action}`;
    try {
      const res = await ipc.invoke(channel, { orderId });
      if (res?.success) {
        const label: Record<string, string> = { startPreparation: 'Preparo iniciado', readyToPickup: 'Pronto para retirada', dispatch: 'Saiu para entrega' };
        addToast(`✅ Pedido iFood: ${label[action] || action}`, 'success');
        ifoodLog.info('ifood action', { action });
      } else {
        addToast(`❌ ${res?.error || `Erro ao executar ${action}`}`, 'error');
      }
    } catch {
      addToast(`❌ Erro ao executar ${action}`, 'error');
    }
  };

  const runWithManagerAuth = (action: () => void) => {
    if (isAuthValid()) action();
    else {
      setShowPassModal({ show: true, onResult: action });
    }
  };

  return (
    <div className="flex h-screen bg-surface text-primary font-sans overflow-hidden select-none">
      <div className="flex flex-col">
        <OrderSidebar
          tables={safeTables}
          activeTableId={activeTableId}
          onSelectTable={(id) => { if (ifoodUnreadCount > 0) setIfoodUnreadCount(0); setActiveTable(id); }}
          onNewTable={() => navigate('/pdv/new-table')}
          onOpenReports={() => navigate('/reports')}
          onOpenSettings={() => runWithManagerAuth(() => navigate('/settings'))}
          onOpenCash={() => runWithManagerAuth(() => setShowCashModal(true))}
          onLogout={handleLogout}
          onDeleteTable={(id) => deleteTable(id!)}
          ifoodConnected={!!ifoodConfig.enabled}
          ifoodUnreadCount={ifoodUnreadCount}
        />
        <div className="p-2 border-t border-border bg-surface flex items-center justify-between">
          <ConnectionIndicator isOnline={isOnline} pendingCount={pendingCount} />
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-surface-light rounded-md text-muted hover:text-primary transition-colors"
            title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={async () => {
              try { await (window as any).electron?.ipcRenderer?.invoke('update:check'); } catch (e) { console.error(e); }
            }}
            className="p-1.5 hover:bg-surface-light rounded-md text-muted hover:text-primary transition-colors"
            title="Verificar atualizações"
            aria-label="Verificar atualizações"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <Outlet />
      </div>

      <CartPanel
        activeTable={activeTable}
        onRemoveItem={removeItemFromActiveTable}
        onCheckout={() => navigate('/checkout')}
        onDeleteTable={(id) => { if (id !== null) deleteTable(id); }}
        ifoodOrderId={activeTable?.ifoodOrderId || null}
        onIfoodAction={handleIfoodAction}
      />

      <ToastContainer />
      <LoadingOverlay />
      <UpdateManager />

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
