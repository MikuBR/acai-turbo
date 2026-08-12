import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import useLoadingStore from '../../store/loadingStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import SettingsModal from '../../components/organisms/SettingsModal.jsx';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { catalog, setCatalog } = useStore();
  const { currentUser } = useAuthStore();

  const settingsLog = logger.withScope('settings');
  const inventoryLog = logger.withScope('inventory');
  const financialLog = logger.withScope('financial');
  const clientsLog = logger.withScope('clients');
  const ifoodLog = logger.withScope('ifood');
  const usersLog = logger.withScope('users');
  const catalogLog = logger.withScope('catalog');

  // Local settings state (migrated from App.jsx)
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newProd, setNewProd] = useState({ id: null, name: '', price: '', category: '', ingredients: '' });
  const [settingsTab, setSettingsTab] = useState('products');
  const [promotions, setPromotions] = useState([]);
  const [newPromo, setNewPromo] = useState({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true });

  // Users
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ id: null, username: '', password: '', full_name: '', role: 'operator' });

  // Inventory
  const [inventory, setInventory] = useState([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [inventoryForm, setInventoryForm] = useState({ productId: '', quantity: '', unit: 'un', minQuantity: '' });

  // Financial
  const [financialAccounts, setFinancialAccounts] = useState([]);
  const [financialForm, setFinancialForm] = useState({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' });
  const [financialFilter, setFinancialFilter] = useState({ type: 'all', status: 'all', startDate: '', endDate: '' });

  // Clients
  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState({ id: null, name: '', phone: '', address: '', email: '', notes: '' });
  const [selectedClientOrders, setSelectedClientOrders] = useState([]);

  // Printer
  const [printerConfig, setPrinterConfig] = useState({ kitchenIp: '192.168.1.100', frontName: 'TANCA' });

  // iFood (local copy for editing; AppLayout keeps its own copy for sidebar display)
  const [ifoodConfig, setIfoodConfig] = useState({ clientId: '', clientSecret: '', merchantId: '', enabled: false });
  const [ifoodConnectionStatus, setIfoodConnectionStatus] = useState('');
  const [isTestingIfood, setIsTestingIfood] = useState(false);

  // Password (change own password — manager/admin only)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '' });

  // ---- Handlers (migrated from App.jsx) ----

  const syncDB = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Sincronizando dados...');
      Promise.all([
        ipc.invoke('catalog:get-products'),
        ipc.invoke('catalog:get-categories'),
        ipc.invoke('promotions:get'),
      ]).then(([products, cats, promos]) => {
        if (products?.success) { setCatalog(products.data || []); catalogLog.info('products loaded'); }
        else addToast('Erro ao carregar produtos', 'error');
        if (cats?.success) setCategories(cats.data || []);
        else addToast('Erro ao carregar categorias', 'error');
        if (promos?.success) setPromotions(promos.data || []);
      }).finally(() => clearLoading());
    }
  };

  const loadUsers = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('users:get').then(res => {
        if (res && res.success) { setUsers(res.data || []); usersLog.info('users loaded'); }
        else addToast('Erro ao carregar usuários', 'error');
      });
    }
  };

  const loadInventory = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Carregando estoque...');
      ipc.invoke('inventory:get').then(res => {
        if (res && res.success) {
          setInventory(res.data || []);
          inventoryLog.info('inventory loaded');
          const lowStock = res.data.filter(i => i.quantity <= i.min_quantity);
          if (lowStock.length > 0) {
            setTimeout(() => {
              addToast(`${lowStock.length} produto(s) com estoque baixo.`, 'warning', 6000);
            }, 500);
          }
        } else {
          addToast('Erro ao carregar estoque', 'error');
        }
      }).finally(() => clearLoading());
    }
  };

  const loadInventoryMovements = (inventoryId) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('inventory:get-movements', { inventoryId, limit: 50 }).then(res => {
        if (res && res.success) setInventoryMovements(res.data || []);
        else addToast('Erro ao carregar movimentações', 'error');
      });
    }
  };

  const loadFinancialAccounts = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Carregando dados financeiros...');
      const typeFilter = financialFilter.type === 'all' ? null : financialFilter.type;
      const statusFilter = financialFilter.status === 'all' ? null : financialFilter.status;
      const startDate = financialFilter.startDate || null;
      const endDate = financialFilter.endDate || null;
      ipc.invoke('financial:get-accounts', { type: typeFilter, status: statusFilter, startDate, endDate }).then(res => {
        if (res && res.success) { setFinancialAccounts(res.data || []); financialLog.info('financial accounts loaded'); }
        else addToast('Erro ao carregar contas financeiras', 'error');
      }).finally(() => clearLoading());
    }
  };

  const loadClients = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('clients:get').then(res => { if (res && res.success) { setClients(res.data || []); clientsLog.info('clients loaded'); } });
    }
  };

  const loadClientOrders = (clientId) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('clients:get-orders', clientId).then(res => { if (res && res.success) setSelectedClientOrders(res.data || []); });
    }
  };

  const loadPrinterConfig = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('config:get-all').then(res => {
        if (res && res.success) {
          const configs = res.data || [];
          const getCfg = (key, def) => { const c = configs.find(x => x.key === key); return c ? c.value : def; };
          setPrinterConfig({
            kitchenIp: getCfg('printer_kitchen_ip', '192.168.1.100'),
            frontName: getCfg('printer_front_name', 'TANCA'),
          });
        }
      });
    }
  };

  const savePrinterConfig = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Salvando configurações...');
      Promise.all([
        ipc.invoke('config:update', { key: 'printer_kitchen_ip', value: printerConfig.kitchenIp }),
        ipc.invoke('config:update', { key: 'printer_front_name', value: printerConfig.frontName }),
      ]).then(([kitchenRes, frontRes]) => {
        if (kitchenRes?.success && frontRes?.success) {
          addToast('Configurações de impressão salvas com sucesso!', 'success');
          settingsLog.info('printer config saved');
        } else {
          addToast('Erro ao salvar configurações de impressão', 'error');
        }
      }).finally(() => clearLoading());
    }
  };

  const loadIfoodConfig = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('config:get-all').then(res => {
        if (res && res.success) {
          const configs = res.data || [];
          const getCfg = (key, def) => { const c = configs.find(x => x.key === key); return c ? c.value : def; };
          const clientId = getCfg('ifood_client_id', '');
          const clientSecret = getCfg('ifood_client_secret', '');
          const merchantId = getCfg('ifood_merchant_id', '');
          const enabled = !!(clientId && clientSecret && merchantId);
          setIfoodConfig({ clientId, clientSecret, merchantId, enabled });
        }
      });
    }
  };

  const saveIfoodConfig = () => {
    const ipc = getIPC();
    if (!ipc) { addToast('Sem conexão com o sistema', 'error'); return; }
    setLoading('Salvando configurações iFood...');
    Promise.all([
      ipc.invoke('config:update', { key: 'ifood_client_id', value: ifoodConfig.clientId }),
      ipc.invoke('config:update', { key: 'ifood_client_secret', value: ifoodConfig.clientSecret }),
      ipc.invoke('config:update', { key: 'ifood_merchant_id', value: ifoodConfig.merchantId }),
    ]).then(([idRes, secretRes, merchantRes]) => {
      if (idRes?.success && secretRes?.success && merchantRes?.success) {
        ipc.invoke('ifood:start-polling', {
          clientId: ifoodConfig.clientId,
          clientSecret: ifoodConfig.clientSecret,
          merchantId: ifoodConfig.merchantId,
          enabled: ifoodConfig.enabled,
        }).then(res => {
          if (res?.success) {
            addToast('Configurações iFood salvas com sucesso!', 'success');
            ifoodLog.info('ifood config saved');
          } else {
            addToast(res?.error || 'Erro ao ativar polling iFood', 'error');
          }
        });
      } else {
        addToast('Erro ao salvar configurações iFood', 'error');
      }
    }).finally(() => clearLoading());
  };

  const handleTestIfoodConnection = async () => {
    const ipc = getIPC();
    if (!ipc) { addToast('Sem conexão com o sistema', 'error'); return; }
    if (!ifoodConfig.clientId || !ifoodConfig.clientSecret || !ifoodConfig.merchantId) {
      addToast('Preencha todos os campos', 'warning');
      return;
    }
    setIsTestingIfood(true);
    setIfoodConnectionStatus('');
    try {
      const res = await ipc.invoke('ifood:test-connection', {
        clientId: ifoodConfig.clientId,
        clientSecret: ifoodConfig.clientSecret,
        merchantId: ifoodConfig.merchantId,
      });
      if (res?.success) {
        setIfoodConnectionStatus('✅ Conectado ao iFood com sucesso');
        addToast('✅ Conexão iFood estabelecida!', 'success');
        ifoodLog.info('ifood connection tested');
      } else {
        setIfoodConnectionStatus(`❌ ${res?.error || 'Falha na conexão'}`);
        addToast(`❌ ${res?.error || 'Falha na conexão'}`, 'error');
      }
    } catch {
      setIfoodConnectionStatus('❌ Erro ao testar conexão');
      addToast('Erro ao testar conexão iFood', 'error');
    } finally {
      setIsTestingIfood(false);
    }
  };

  const hasPermission = (action) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const permissions = {
      admin: ['all'],
      manager: ['edit_products', 'delete_products', 'edit_promotions', 'delete_promotions', 'cancel_orders', 'access_settings', 'manage_users'],
      operator: ['view_reports', 'create_orders']
    };
    if (role === 'admin') return true;
    return permissions[role]?.includes(action) || false;
  };

  // runWithAuth preserved for SettingsModal internal calls
  const runWithAuth = (callback, requiredPermission = null) => {
    if (requiredPermission && !hasPermission(requiredPermission)) {
      addToast('Você não tem permissão para realizar esta ação.', 'error');
      return;
    }
    callback();
  };

  // Mount: load all data needed by settings tabs
  useEffect(() => {
    syncDB();
    loadPrinterConfig();
    loadIfoodConfig();
    loadUsers();
    loadInventory();
    loadFinancialAccounts();
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeCatalog = catalog || [];

  return (
    <SettingsModal
      isOpen={true}
      onClose={() => navigate('/pdv')}
      settingsTab={settingsTab}
      setSettingsTab={setSettingsTab}
      safeCatalog={safeCatalog}
      categories={categories}
      newCatName={newCatName}
      setNewCatName={setNewCatName}
      newProd={newProd}
      setNewProd={setNewProd}
      newPromo={newPromo}
      setNewPromo={setNewPromo}
      users={users}
      newUser={newUser}
      setNewUser={setNewUser}
      inventory={inventory}
      inventoryForm={inventoryForm}
      setInventoryForm={setInventoryForm}
      selectedInventoryItem={selectedInventoryItem}
      setSelectedInventoryItem={setSelectedInventoryItem}
      inventoryMovements={inventoryMovements}
      loadInventoryMovements={loadInventoryMovements}
      financialAccounts={financialAccounts}
      financialForm={financialForm}
      setFinancialForm={setFinancialForm}
      financialFilter={financialFilter}
      setFinancialFilter={setFinancialFilter}
      clients={clients}
      clientForm={clientForm}
      setClientForm={setClientForm}
      selectedClientOrders={selectedClientOrders}
      promotions={promotions}
      pwdForm={pwdForm}
      setPwdForm={setPwdForm}
      syncDB={syncDB}
      loadUsers={loadUsers}
      loadInventory={loadInventory}
      loadFinancialAccounts={loadFinancialAccounts}
      loadClients={loadClients}
      loadClientOrders={loadClientOrders}
      runWithAuth={runWithAuth}
      getIPC={getIPC}
      printerConfig={printerConfig}
      setPrinterConfig={setPrinterConfig}
      savePrinterConfig={savePrinterConfig}
      currentUser={currentUser}
      ifoodConfig={ifoodConfig}
      setIfoodConfig={setIfoodConfig}
      handleTestIfoodConnection={handleTestIfoodConnection}
      isTestingIfood={isTestingIfood}
      ifoodConnectionStatus={ifoodConnectionStatus}
      saveIfoodConfig={saveIfoodConfig}
    />
  );
}
