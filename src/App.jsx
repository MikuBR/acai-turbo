import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useStore } from './store/useStore';
import useToastStore from './store/toastStore';
import useLoadingStore from './store/loadingStore';
import ToastContainer from './components/atoms/Toast';
import LoadingOverlay from './components/atoms/LoadingOverlay';
import { 
  Search, ChevronRight
} from 'lucide-react';

import { ProductCard } from './components/atoms/ProductCard';
import {
  OrderSidebar, CartPanel, SettingsModal, LoginModal,
  CheckoutModal, AcaiBuilderModal, QuickBuilderModal, PasswordModal,
  ManagerAuthModal, ReportsModal, NewTableModal
} from './components/organisms';

function App() {
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { 
    activeTableId, tables, catalog, setActiveTable, addItemToActiveTable, 
    removeItemFromActiveTable, addTable, checkoutActiveTable, setCatalog 
  } = useStore();

  const [builder, setBuilder] = useState(null);
  const [simpleBuilder, setSimpleBuilder] = useState(null);
  const [modals, setModals] = useState({ newTable: false, settings: false, checkout: false, reports: false, login: true, changePassword: false });
  const [changePasswordForm, setChangePasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [authTime, setAuthTime] = useState(0);

  // Helper function to get IPC instance with automatic error handling
  const getIPC = () => {
    if (window.electron && window.electron.ipcRenderer) {
      const raw = window.electron.ipcRenderer;
      return {
        invoke: (channel, ...args) =>
          raw.invoke(channel, ...args).catch(err => {
            console.error(`[IPC] ${channel} failed:`, err);
            return { success: false, error: err.message };
          }),
        on: raw.on.bind(raw),
        once: raw.once.bind(raw),
        removeListener: raw.removeListener.bind(raw),
      };
    }
    return null;
  }; 
  const [showPassModal, setShowPassModal] = useState({ show: false, onResult: null });
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');

  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newProd, setNewProd] = useState({ id: null, name: '', price: '', category: '', ingredients: '' });
  
  // ESTADOS NOVA COMANDA/DELIVERY
  const [tableType, setTableType] = useState('SALAO');
  const [newTableName, setNewTableName] = useState('');
  const [delivForm, setDelivForm] = useState({ name: '', phone: '', address: '', fee: '' });
  
  const [amountReceived, setAmountReceived] = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', next: '' });
  const [reportData, setReportData] = useState({ sales: [], movements: [], topProducts: [] });
  const [ordersHistory, setOrdersHistory] = useState([]);
  const [cashMove, setCashMove] = useState({ type: 'SAIDA', amount: '', description: '' });
  const [reportPeriod, setReportPeriod] = useState({ startDate: '', endDate: '' });
  const [advancedReportData, setAdvancedReportData] = useState(null);
  const [financialSummary, setFinancialSummary] = useState({ payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } });
  
  // ESTADOS PROMOÇÕES
  const [promotions, setPromotions] = useState([]);
  const [newPromo, setNewPromo] = useState({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true });
  const [settingsTab, setSettingsTab] = useState('products');
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  // ESTADOS USUÁRIOS
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ id: null, username: '', password: '', full_name: '', role: 'operator' });

  // ESTADOS ESTOQUE
  const [inventory, setInventory] = useState([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [inventoryForm, setInventoryForm] = useState({ productId: '', quantity: '', unit: 'un', minQuantity: '' });

  // ESTADOS FINANCEIROS
  const [financialAccounts, setFinancialAccounts] = useState([]);
  const [financialForm, setFinancialForm] = useState({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' });
  const [financialFilter, setFinancialFilter] = useState({ type: 'all', status: 'all', startDate: '', endDate: '' });

  // ESTADOS CLIENTES
  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState({ id: null, name: '', phone: '', address: '', email: '', notes: '' });
  const [selectedClientOrders, setSelectedClientOrders] = useState([]);

  // ESTADOS IMPRESSORAS
  const [printerConfig, setPrinterConfig] = useState({ kitchenIp: '192.168.1.100', frontName: 'TANCA' });

  const syncDB = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Sincronizando dados...');
      Promise.all([
        ipc.invoke('catalog:get-products'),
        ipc.invoke('catalog:get-categories'),
        ipc.invoke('promotions:get'),
      ]).then(([products, categories, promotions]) => {
        if (products?.success) setCatalog(products.data || []);
        else addToast('Erro ao carregar produtos', 'error');
        if (categories?.success) setCategories(categories.data || []);
        else addToast('Erro ao carregar categorias', 'error');
        if (promotions?.success) setPromotions(promotions.data || []);
      }).finally(() => clearLoading());
    }
  };

  const loadUsers = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('users:get').then(res => {
        if (res && res.success) setUsers(res.data || []);
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
          const lowStock = res.data.filter(i => i.quantity <= i.min_quantity);
          if (lowStock.length > 0) {
            setTimeout(() => {
              addToast(`${lowStock.length} produto(s) com estoque baixo. Verifique em Configurações > Estoque.`, 'warning', 6000);
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
        if (res && res.success) setFinancialAccounts(res.data || []);
        else addToast('Erro ao carregar contas financeiras', 'error');
      }).finally(() => clearLoading());
    }
  };

  const loadClients = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('clients:get').then(res => { if (res && res.success) setClients(res.data || []); });
    }
  };

  const loadClientOrders = (clientId) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('clients:get-orders', clientId).then(res => { if (res && res.success) setSelectedClientOrders(res.data || []); });
    }
  };

  const loadReports = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Carregando relatórios...');
      Promise.all([
        ipc.invoke('reports:daily'),
        ipc.invoke('orders:get-history'),
      ]).then(([daily, history]) => {
        if (daily?.success) setReportData(daily.data);
        else addToast('Erro ao carregar relatório diário', 'error');
        if (history?.success) setOrdersHistory(history.data);
      }).finally(() => clearLoading());
      const today = new Date().toISOString().split('T')[0];
      loadFinancialSummary(today, today);
    }
  };

  const loadAdvancedReport = () => {
    const ipc = getIPC();
    if (ipc && reportPeriod.startDate && reportPeriod.endDate) {
      setLoading('Carregando relatório...');
      ipc.invoke('reports:by-period', reportPeriod).then(res => {
        if (res && res.success) setAdvancedReportData(res.data);
        else addToast('Erro ao carregar relatório do período', 'error');
      }).finally(() => clearLoading());
      loadFinancialSummary(reportPeriod.startDate, reportPeriod.endDate);
    }
  };

  const loadFinancialSummary = (startDate, endDate) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('financial:get-summary', { startDate, endDate }).then(res => {
        if (res && res.success) setFinancialSummary(res.data);
        else addToast('Erro ao carregar resumo financeiro', 'error');
      });
    }
  };

  const calculateDiscount = (promo, total) => {
    if (!promo) return 0;
    if (promo.type === 'PERCENTAGE') {
      return total * (promo.value / 100);
    } else if (promo.type === 'FIXED_AMOUNT') {
      return Math.min(promo.value, total);
    }
    return 0;
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
        } else {
          addToast('Erro ao salvar configurações de impressão', 'error');
        }
      }).finally(() => clearLoading());
    }
  };

  useEffect(() => { syncDB(); loadPrinterConfig(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.username || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      setIsLoggingIn(true);
      try {
        const res = await ipc.invoke('auth:login', loginForm);
        if (res.success) {
          setCurrentUser(res.user);
          setAuthToken(res.token);
          localStorage.setItem('authToken', res.token);

          if (res.user.must_change_password) {
            setModals({ ...modals, login: false, changePassword: true });
          } else {
            setModals({ ...modals, login: false });
          }

          setLoginForm({ username: '', password: '' });
        } else {
          setLoginError(res.error || 'Erro ao fazer login');
        }
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const handleLogout = async () => {
    const ipc = getIPC();
    if (ipc && authToken && currentUser) {
      await ipc.invoke('auth:logout', { token: authToken, userId: currentUser.id });
    }
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    setModals({ ...modals, login: true });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!changePasswordForm.current || !changePasswordForm.new || !changePasswordForm.confirm) {
      addToast('Preencha todos os campos', 'warning');
      return;
    }

    if (changePasswordForm.new !== changePasswordForm.confirm) {
      addToast('A nova senha e a confirmação não coincidem', 'warning');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      const res = await ipc.invoke('auth:change-user-password', {
        userId: currentUser.id,
        current: changePasswordForm.current,
        new: changePasswordForm.new
      });

      if (res.success) {
        addToast('Senha alterada com sucesso!', 'success');
        setChangePasswordForm({ current: '', new: '', confirm: '' });
        setModals({ ...modals, changePassword: false });
      } else {
        addToast('Erro: ' + res.error, 'error');
      }
    }
  };

  // Clear any saved session on mount (user must login every time)
  useEffect(() => {
    localStorage.removeItem('authToken');
  }, []);

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

  const runWithAuth = (callback, requiredPermission = null) => {
    if (requiredPermission && !hasPermission(requiredPermission)) {
      addToast('Você não tem permissão para realizar esta ação.', 'error');
      return;
    }
    callback();
  };

  const safeCatalog = catalog || [];
  const safeTables = tables || [];
  const activeTable = useMemo(() => safeTables.find(t => t.id === activeTableId) || safeTables[0] || { id: 1, name: 'BALCÃO', isDelivery: false, address: '', phone: '', items: [], total: 0 }, [safeTables, activeTableId]);
  
  const categoriesMenu = useMemo(() => {
    return ['TODOS', ...categories.map(c => c.name.toUpperCase())].filter(c => c !== 'ADICIONAIS DOCES');
  }, [categories]);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredProducts = useMemo(() => {
    return safeCatalog.filter(p => {
      const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
      const matchSearch = p.name?.toLowerCase().includes(deferredSearchTerm.toLowerCase());
      return matchCat && matchSearch && p.category !== 'ADICIONAIS DOCES';
    });
  }, [safeCatalog, selectedCategory, deferredSearchTerm]);

  const acaiBases = useMemo(() => safeCatalog.filter(p => p.category === 'COPOS DE AÇAÍ'), [safeCatalog]);
  const availableAddons = useMemo(() => safeCatalog.filter(p => p.category === 'ADICIONAIS DOCES'), [safeCatalog]);

  const isAuthValid = () => Date.now() < authTime + 300000;

  const runWithManagerAuth = (action) => {
    if (isAuthValid()) action();
    else {
      setShowPassModal({ show: true, onResult: action });
    }
  };

  const handleAddTable = () => {
    if (tableType === 'SALAO') {
      if(!newTableName.trim()) return;
      let name = newTableName.trim();
      if (/^\d+$/.test(name)) name = `MESA ${name.padStart(2, '0')}`;
      else name = name.toUpperCase();
      addTable(name);
    } else {
      if(!delivForm.name.trim()) return;
      addTable({
        name: delivForm.name.trim().toUpperCase(),
        isDelivery: true,
        phone: delivForm.phone,
        address: delivForm.address,
        fee: parseFloat(delivForm.fee || 0)
      });
    }
    setNewTableName('');
    setDelivForm({ name: '', phone: '', address: '', fee: '' });
    setModals({...modals, newTable: false});
  };

  const handleItemSelect = (p) => {
    if (p.category === 'COPOS DE AÇAÍ' || (p.ingredients && p.ingredients.length > 0)) {
      const defaults = p.ingredients ? p.ingredients.split(',').map(i => i.trim()).filter(Boolean) : [];
      setBuilder({ base: p, standard: defaults, removals: [], extras: [], obs: '', quantity: 1, adjustment: 0 });
    } else {
      setSimpleBuilder({ product: p, quantity: 1, obs: '', adjustment: 0 });
    }
  };

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
    const unitPrice = Math.max(0, builder.base.price + extrasPrice + parseFloat(builder.adjustment || 0));
    const notes = [
      builder.removals.length > 0 ? `SEM: ${builder.removals.join(', ')}` : '',
      builder.extras.length > 0 ? `ADD: ${builder.extras.map(e => `${e.qty}x ${e.name}`).join(', ')}` : '',
      builder.obs ? `OBS: ${builder.obs}` : '',
      builder.adjustment != 0 ? `ADJ: R$ ${builder.adjustment}` : ''
    ].filter(Boolean).join(' | ');

    addItemToActiveTable({ ...builder.base, name: `${builder.quantity > 1 ? builder.quantity + 'x ' : ''}${builder.base.name}`, price: unitPrice * builder.quantity, notes, category: builder.base.category });
    setBuilder(null);
  };

  const confirmSimpleBuild = () => {
    if (!simpleBuilder?.product) return;
    const unitPrice = Math.max(0, simpleBuilder.product.price + parseFloat(simpleBuilder.adjustment || 0));
    addItemToActiveTable({ ...simpleBuilder.product, name: `${simpleBuilder.quantity > 1 ? simpleBuilder.quantity + 'x ' : ''}${simpleBuilder.product.name}`, price: unitPrice * simpleBuilder.quantity, notes: simpleBuilder.obs + (simpleBuilder.adjustment != 0 ? ` | ADJ: R$ ${simpleBuilder.adjustment}` : ''), category: simpleBuilder.product.category });
    setSimpleBuilder(null);
  };

  const handleFinalize = () => {
    const ipc = getIPC();
    if (ipc) {
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
           paymentMethod: paymentMethod,
           isDelivery: activeTable.isDelivery,
           address: activeTable.address,
           phone: activeTable.phone
         },
         items: activeTable.items || []
       }).then(res => {
         if (res && res.success) {
           addToast('Pedido finalizado com sucesso!', 'success');
           checkoutActiveTable();
           loadReports();
           setModals({ ...modals, checkout: false });
           setAmountReceived(''); setPaymentMethod('DINHEIRO');
           setSelectedPromotion(null);
         } else {
           addToast(res?.error || 'Erro ao finalizar pedido', 'error');
         }
       }).finally(() => clearLoading());
    }
  };


  return (
    <div className="flex h-screen bg-surface text-primary font-sans overflow-hidden select-none">
      
      {/* 1. SIDEBAR - COMANDAS */}
      <OrderSidebar
        tables={safeTables}
        activeTableId={activeTableId}
        onSelectTable={setActiveTable}
        onNewTable={() => setModals({...modals, newTable: true})}
        onOpenReports={() => { setModals({...modals, reports: true}); loadReports(); }}
        onOpenSettings={() => runWithManagerAuth(() => setModals({...modals, settings: true}))}
        onLogout={handleLogout}
      />

      {/* 2. ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <div className="p-4 bg-surface border-b border-border flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input type="text" placeholder="Pesquisar..." className="w-full bg-surface-light border border-border p-2 pl-10 rounded-lg outline-none focus:border-primary transition-all text-sm select-text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {categoriesMenu.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${selectedCategory === c ? 'bg-primary border-primary-dark text-surface' : 'bg-surface-light border-border text-muted hover:text-primary'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(selectedCategory === 'TODOS' || selectedCategory.includes('AÇAÍ')) && (
              <button onClick={() => setBuilder({ base: null, standard: [], removals: [], extras: [], obs: '', quantity: 1, adjustment: 0 })} className="col-span-2 h-28 bg-gradient-to-br from-primary-dark to-primary p-5 rounded-xl border border-white/5 shadow-lg flex items-center justify-between group active:scale-95 transition-all">
                <div className="text-left">
                  <span className="font-bold text-lg block text-white uppercase tracking-tight">Montagem</span>
                  <span className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Personalizar Açaí</span>
                </div>
                <ChevronRight size={24} className="text-white opacity-50"/>
              </button>
            )}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-muted text-xs py-16">
                {searchTerm ? 'Nenhum produto encontrado para "' + searchTerm + '"' : 'Nenhum produto disponível'}
              </div>
            )}
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onSelect={handleItemSelect} />
            ))}
          </div>
        </div>
      </div>

      {/* 3. CARRINHO DIREITA */}
      <CartPanel
        activeTable={activeTable}
        onRemoveItem={removeItemFromActiveTable}
        onCheckout={() => setModals({...modals, checkout: true})}
      />

      {/* --- MODAIS PRINCIPAIS --- */}

      {modals.newTable && <NewTableModal
        isOpen={modals.newTable}
        onClose={() => setModals({...modals, newTable: false})}
        tableType={tableType}
        setTableType={setTableType}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        delivForm={delivForm}
        setDelivForm={setDelivForm}
        handleAddTable={handleAddTable}
      />}

      {modals.reports && <ReportsModal
        isOpen={modals.reports}
        onClose={() => setModals({...modals, reports: false})}
        advancedReportData={advancedReportData}
        setAdvancedReportData={setAdvancedReportData}
        reportData={reportData}
        reportPeriod={reportPeriod}
        setReportPeriod={setReportPeriod}
        ordersHistory={ordersHistory}
        cashMove={cashMove}
        setCashMove={setCashMove}
        loadReports={loadReports}
        loadAdvancedReport={loadAdvancedReport}
        runWithAuth={runWithAuth}
        getIPC={getIPC}
        financialSummary={financialSummary}
      />}

      {builder && <AcaiBuilderModal
        builder={builder}
        onClose={() => setBuilder(null)}
        setBuilder={setBuilder}
        acaiBases={acaiBases}
        availableAddons={availableAddons}
        toggleRemoval={toggleRemoval}
        updateExtraInBuilder={updateExtraInBuilder}
        confirmFullBuild={confirmFullBuild}
      />}

      {simpleBuilder && <QuickBuilderModal
        builder={simpleBuilder}
        onClose={() => setSimpleBuilder(null)}
        setBuilder={setSimpleBuilder}
        confirmSimpleBuild={confirmSimpleBuild}
      />}

      {modals.settings && <SettingsModal
        isOpen={modals.settings}
        onClose={() => setModals({...modals, settings: false})}
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
      />}

      {modals.checkout && <CheckoutModal
        isOpen={modals.checkout}
        onClose={() => setModals({...modals, checkout: false})}
        activeTable={activeTable}
        promotions={promotions}
        selectedPromotion={selectedPromotion}
        setSelectedPromotion={setSelectedPromotion}
        calculateDiscount={calculateDiscount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        handleFinalize={handleFinalize}
      />}

      {modals.login && <LoginModal
        isOpen={modals.login}
        onClose={() => setModals({...modals, login: false})}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        handleLogin={handleLogin}
        submitting={isLoggingIn}
      />}

      {modals.changePassword && <PasswordModal
        isOpen={modals.changePassword}
        onClose={() => setModals({...modals, changePassword: false})}
        changePasswordForm={changePasswordForm}
        setChangePasswordForm={setChangePasswordForm}
        handleChangePassword={handleChangePassword}
      />}

      {showPassModal.show && <ManagerAuthModal
        show={showPassModal.show}
        onCancel={() => setShowPassModal({ show: false, onResult: null })}
        onSuccess={() => { setAuthTime(Date.now()); showPassModal.onResult?.(); }}
        ipcGet={getIPC}
      />}

      <ToastContainer />
      <LoadingOverlay />

    </div>
  );
}

export default App;