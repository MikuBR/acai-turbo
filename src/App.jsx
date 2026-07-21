import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useStore } from './store/useStore';
import { 
  ShoppingCart, Check, X, Settings, Trash2, Search, 
  ChevronRight, Plus, Pencil, Lock, FileText, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';

function App() {
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
  
  const [authTime, setAuthTime] = useState(0);

  // Helper function to get IPC instance
  const getIPC = () => {
    if (window.electron && window.electron.ipcRenderer) {
      return window.electron.ipcRenderer;
    } else if (window.require) {
      return window.require('electron').ipcRenderer;
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
  const [financialFilter, setFinancialFilter] = useState({ type: 'all', status: 'all' });

  // ESTADOS CLIENTES
  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState({ id: null, name: '', phone: '', address: '', email: '', notes: '' });
  const [selectedClientOrders, setSelectedClientOrders] = useState([]);

  const syncDB = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-products').then(res => { if (res && res.success) setCatalog(res.data || []); });
      ipc.invoke('get-categories').then(res => { if (res && res.success) setCategories(res.data || []); });
      ipc.invoke('get-promotions').then(res => { if (res && res.success) setPromotions(res.data || []); });
    }
  };

  const loadUsers = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-users').then(res => { if (res && res.success) setUsers(res.data || []); });
    }
  };

  const loadInventory = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-inventory').then(res => {
        if (res && res.success) {
          setInventory(res.data || []);
          // Check for low stock items and show alert
          const lowStock = res.data.filter(i => i.quantity <= i.min_quantity);
          if (lowStock.length > 0) {
            setTimeout(() => {
              alert(`⚠️ ATENÇÃO: ${lowStock.length} produto(s) com estoque baixo:\n${lowStock.map(i => `- ${i.product_name}: ${i.quantity} ${i.unit}`).join('\n')}`);
            }, 500);
          }
        }
      });
    }
  };

  const loadInventoryMovements = (inventoryId) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-inventory-movements', { inventoryId, limit: 50 }).then(res => { if (res && res.success) setInventoryMovements(res.data || []); });
    }
  };

  const loadFinancialAccounts = () => {
    const ipc = getIPC();
    if (ipc) {
      const typeFilter = financialFilter.type === 'all' ? null : financialFilter.type;
      const statusFilter = financialFilter.status === 'all' ? null : financialFilter.status;
      ipc.invoke('get-financial-accounts', { type: typeFilter, status: statusFilter }).then(res => { if (res && res.success) setFinancialAccounts(res.data || []); });
    }
  };

  const loadClients = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-clients').then(res => { if (res && res.success) setClients(res.data || []); });
    }
  };

  const loadClientOrders = (clientId) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-client-orders', clientId).then(res => { if (res && res.success) setSelectedClientOrders(res.data || []); });
    }
  };

  const loadReports = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-daily-report').then(res => { if (res && res.success) setReportData(res.data); });
      ipc.invoke('get-orders').then(res => { if (res && res.success) setOrdersHistory(res.data); });
    }
  };

  const loadAdvancedReport = () => {
    const ipc = getIPC();
    if (ipc && reportPeriod.startDate && reportPeriod.endDate) {
      ipc.invoke('get-report-by-period', reportPeriod).then(res => {
        if (res && res.success) setAdvancedReportData(res.data);
      });
    }
  };

  const loadActivePromotions = () => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('get-active-promotions').then(res => {
        if (res && res.success) setPromotions(res.data || []);
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

  useEffect(() => { syncDB(); }, []);

  // Authentication functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.username || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      const res = await ipc.invoke('login', loginForm);
      if (res.success) {
        setCurrentUser(res.user);
        setAuthToken(res.token);
        localStorage.setItem('authToken', res.token);

        // Check if user must change password
        if (res.user.must_change_password) {
          setModals({ ...modals, login: false, changePassword: true });
        } else {
          setModals({ ...modals, login: false });
        }

        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError(res.error || 'Erro ao fazer login');
      }
    }
  };

  const handleLogout = async () => {
    const ipc = getIPC();
    if (ipc && authToken && currentUser) {
      await ipc.invoke('logout', { token: authToken, userId: currentUser.id });
    }
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    setModals({ ...modals, login: true });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!changePasswordForm.current || !changePasswordForm.new || !changePasswordForm.confirm) {
      alert('Preencha todos os campos');
      return;
    }

    if (changePasswordForm.new !== changePasswordForm.confirm) {
      alert('A nova senha e a confirmação não coincidem');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      const res = await ipc.invoke('change-user-password', {
        userId: currentUser.id,
        current: changePasswordForm.current,
        new: changePasswordForm.new
      });

      if (res.success) {
        alert('Senha alterada com sucesso!');
        setChangePasswordForm({ current: '', new: '', confirm: '' });
        setModals({ ...modals, changePassword: false });
      } else {
        alert('Erro: ' + res.error);
      }
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const ipc = getIPC();
    if (savedToken && ipc) {
      ipc.invoke('verify-session', savedToken).then(res => {
        if (res.success) {
          setCurrentUser(res.user);
          setAuthToken(savedToken);
          setModals({ ...modals, login: false });
        }
      });
    }
  }, []);

  // Permission system
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
      alert('Você não tem permissão para realizar esta ação.');
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
    else setShowPassModal({ show: true, onResult: action });
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

      ipc.invoke('save-order', {
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
          checkoutActiveTable();
          setModals({ ...modals, checkout: false });
          setAmountReceived(''); setPaymentMethod('DINHEIRO');
          setSelectedPromotion(null);
        }
      });
    }
  };

  const inputTheme = "w-full bg-white border border-gray-200 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium select-text shadow-sm";

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden select-none">
      
      {/* 1. SIDEBAR - COMANDAS */}
      <div className="w-64 shrink-0 bg-white border-r border-gray-300 flex flex-col shadow-xl z-10">
        <div className="p-5 border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
            <span className="font-bold text-sm tracking-widest text-gray-900 uppercase">TURBO PDV</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setModals({...modals, reports: true}); loadReports(); }} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 hover:text-emerald-500 transition-colors" title="Caixa e Relatórios">
              <FileText size={18}/>
            </button>
            <button onClick={() => runWithManagerAuth(() => setModals({...modals, settings: true}))} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-900 transition-colors" title="Configurações">
              <Settings size={18}/>
            </button>
            <button onClick={handleLogout} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-colors" title="Sair">
              <X size={18}/>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {safeTables.map(t => (
            <button key={t.id} onClick={() => setActiveTable(t.id)} className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${ activeTableId === t.id ? 'bg-emerald-600/10 border-emerald-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-200/40' }`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xs uppercase tracking-tight truncate pr-2 ${activeTableId === t.id ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {t.isDelivery && <span className="mr-1">🛵</span>}
                  {t.name}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-500">R${(t.total || 0).toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-300">
          <button onClick={() => setModals({...modals, newTable: true})} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg font-bold text-xs tracking-widest transition-all shadow-lg active:scale-95">
            + NOVA COMANDA
          </button>
        </div>
      </div>

      {/* 2. ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-300 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Pesquisar..." className="w-full bg-gray-100 border border-gray-300 p-2 pl-10 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm select-text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {categoriesMenu.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${selectedCategory === c ? 'bg-emerald-600 border-emerald-400 text-slate-950' : 'bg-gray-200 border-gray-300 text-gray-600 hover:text-gray-900'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(selectedCategory === 'TODOS' || selectedCategory.includes('AÇAÍ')) && (
              <button onClick={() => setBuilder({ base: null, standard: [], removals: [], extras: [], obs: '', quantity: 1, adjustment: 0 })} className="col-span-2 h-28 bg-gradient-to-br from-indigo-600 to-emerald-600 p-5 rounded-xl border border-white/5 shadow-lg flex items-center justify-between group active:scale-95 transition-all">
                <div className="text-left">
                  <span className="font-bold text-lg block text-white uppercase tracking-tight">Montagem</span>
                  <span className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Personalizar Açaí</span>
                </div>
                <ChevronRight size={24} className="text-white opacity-50"/>
              </button>
            )}
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => handleItemSelect(p)} className="bg-white border border-gray-300 p-4 rounded-xl hover:border-emerald-500 transition-all flex flex-col justify-between min-h-[8rem] h-full text-left shadow-sm active:scale-[0.98] group">
                  <div className="space-y-1 pb-2">
                    <div className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">{p.category}</div>
                    <span className="font-bold text-xs text-gray-800 group-hover:text-gray-900 leading-tight uppercase block">{p.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-auto">
                    <span className="font-mono font-bold text-sm text-emerald-500">R${(p.price || 0).toFixed(2)}</span>
                    <div className="p-1 bg-gray-200 rounded-lg group-hover:bg-emerald-600 transition-colors text-gray-800 group-hover:text-white"><Plus size={14}/></div>
                  </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CARRINHO DIREITA */}
      <div className="w-80 shrink-0 bg-white border-l border-gray-300 flex flex-col shadow-2xl z-10">
        <div className="p-5 border-b border-gray-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-600"><ShoppingCart size={14}/> RESUMO</div>
            {activeTable.isDelivery 
              ? <span className="text-[9px] bg-orange-500/20 px-2 py-0.5 rounded font-bold text-orange-500 uppercase">DELIVERY</span>
              : <span className="text-[9px] bg-gray-200 px-2 py-0.5 rounded font-bold text-emerald-500 uppercase">{activeTable.name}</span>
            }
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {(activeTable.items || []).map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${item.category === 'TAXA' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-gray-100 border-gray-300'}`}>
              <div className="flex justify-between font-bold text-[11px] mb-1">
                <span className="flex-1 pr-2 uppercase text-gray-800 leading-tight">{item.name}</span>
                <span className={`${item.category === 'TAXA' ? 'text-orange-500' : 'text-emerald-500'} font-mono`}>R${(item.price || 0).toFixed(2)}</span>
              </div>
              {item.notes && <div className="text-[9px] text-gray-600 italic bg-gray-200 p-2 rounded border-l border-emerald-600 mt-1">{item.notes}</div>}
              {item.category !== 'TAXA' && <button onClick={() => removeItemFromActiveTable(idx)} className="mt-2 text-[8px] text-red-500/50 font-bold uppercase hover:text-red-500 transition-colors">Remover</button>}
            </div>
          ))}
        </div>
        <div className="p-5 bg-white border-t border-gray-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black text-emerald-500 font-mono tracking-tighter">R${(activeTable.total || 0).toFixed(2)}</span>
          </div>
          <button disabled={!(activeTable.items?.length > 0)} onClick={() => setModals({...modals, checkout: true})} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-950 transition-all active:scale-95">
            FINALIZAR VENDA
          </button>
        </div>
      </div>

      {/* --- MODAIS PRINCIPAIS --- */}

      {/* MODAL: NOVA COMANDA / DELIVERY */}
      {modals.newTable && (
        <div className="fixed inset-0 bg-gray-900/95 z-[700] flex items-center justify-center p-6 animate-in zoom-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Nova Comanda</h2>
              <button onClick={() => setModals({...modals, newTable: false})} className="p-1.5 bg-gray-200 rounded-md hover:bg-red-500 text-gray-800 hover:text-white transition-all"><X size={16}/></button>
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setTableType('SALAO')} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${tableType === 'SALAO' ? 'bg-indigo-600 text-white' : 'bg-gray-100 border border-gray-300 text-gray-600'}`}>Mesa / Balcão</button>
              <button onClick={() => setTableType('DELIVERY')} className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${tableType === 'DELIVERY' ? 'bg-orange-600 text-white' : 'bg-gray-100 border border-gray-300 text-gray-600'}`}>Delivery</button>
            </div>

            {tableType === 'SALAO' ? (
              <input 
                type="text" placeholder="Ex: Mesa 04, Balcão 2..." value={newTableName} 
                onChange={e => setNewTableName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTable(); }}
                className={`${inputTheme} mb-4 text-lg font-bold`} autoFocus
              />
            ) : (
              <div className="space-y-3 mb-6">
                <input type="text" placeholder="Nome do Cliente*" value={delivForm.name} onChange={e => setDelivForm({...delivForm, name: e.target.value})} className={inputTheme} autoFocus />
                <input type="text" placeholder="Telefone" value={delivForm.phone} onChange={e => setDelivForm({...delivForm, phone: e.target.value})} className={inputTheme} />
                <input type="text" placeholder="Endereço Completo" value={delivForm.address} onChange={e => setDelivForm({...delivForm, address: e.target.value})} className={inputTheme} />
                <div className="bg-gray-100 border border-gray-300 p-3 rounded-xl flex items-center justify-between">
                   <span className="text-[9px] font-bold text-gray-600 uppercase">Taxa Entrega R$</span>
                   <input type="number" step="0.01" value={delivForm.fee} onChange={e => setDelivForm({...delivForm, fee: e.target.value})} className="bg-transparent text-right text-lg font-mono text-gray-900 outline-none font-bold w-20" placeholder="0.00" />
                </div>
              </div>
            )}

            <button onClick={handleAddTable} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-950 transition-all active:scale-95">
              Abrir Comanda
            </button>
          </div>
        </div>
      )}

      {/* MODAL: RELATÓRIOS E CAIXA */}
      {modals.reports && (
        <div className="fixed inset-0 bg-gray-900/95 z-[900] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl border border-gray-300 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center px-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Relatórios</h2>
                <div className="flex gap-2">
                  <button onClick={() => { setAdvancedReportData(null); loadReports(); }} className={`text-[10px] font-bold uppercase px-3 py-1 rounded transition-all ${!advancedReportData ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 hover:text-gray-900'}`}>Hoje</button>
                  <button onClick={() => { setAdvancedReportData(null); }} className={`text-[10px] font-bold uppercase px-3 py-1 rounded transition-all ${advancedReportData ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 hover:text-gray-900'}`}>Período</button>
                </div>
              </div>
              <button onClick={() => setModals({...modals, reports: false})} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div className="w-[400px] p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                {advancedReportData ? (
                  <>
                    <div className="mb-6 p-4 bg-gray-100 rounded-xl border border-gray-300">
                      <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Filtrar por Período</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Data Início</label>
                          <input type="date" value={reportPeriod.startDate} onChange={e => setReportPeriod({...reportPeriod, startDate: e.target.value})} className={inputTheme} />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Data Fim</label>
                          <input type="date" value={reportPeriod.endDate} onChange={e => setReportPeriod({...reportPeriod, endDate: e.target.value})} className={inputTheme} />
                        </div>
                        <button onClick={loadAdvancedReport} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all">Gerar Relatório</button>
                      </div>
                    </div>

                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2">Métricas Avançadas</h3>
                    <div className="space-y-3 mb-6">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
                        <span className="text-[9px] text-gray-600 font-bold uppercase block">Ticket Médio</span>
                        <span className="text-2xl font-bold text-emerald-500 font-mono">R$ {advancedReportData.ticketAverage.toFixed(2)}</span>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                        <span className="text-[9px] text-gray-600 font-bold uppercase block">Horários de Pico</span>
                        <div className="mt-2 space-y-1">
                          {advancedReportData.peakHours.slice(0, 3).map((h, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-700">{h.hour}:00</span>
                              <span className="font-bold text-blue-500">{h.order_count} pedidos</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2">Resumo de Vendas</h3>
                    <div className="space-y-2 mb-8">
                      {reportData.sales.map((s, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-300">
                          <span className="text-xs font-bold text-gray-800">{s.payment_method}</span>
                          <span className="font-mono text-emerald-500 font-bold">R$ {s.total_amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-gray-200 p-3 rounded-lg border border-gray-300 mt-2">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Total Bruto</span>
                        <span className="font-mono text-emerald-400 font-bold text-lg">R$ {reportData.sales.reduce((acc, curr) => acc + curr.total_amount, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2">Lançamento Manual (Gaveta)</h3>
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setCashMove({...cashMove, type: 'ENTRADA'})} className={`py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${cashMove.type === 'ENTRADA' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}><ArrowUpCircle size={14}/> ENTRADA</button>
                    <button onClick={() => setCashMove({...cashMove, type: 'SAIDA'})} className={`py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${cashMove.type === 'SAIDA' ? 'bg-red-600/20 text-red-500 border border-red-500/50' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}><ArrowDownCircle size={14}/> SANGRIA</button>
                  </div>
                  <input type="number" step="0.01" placeholder="Valor R$" value={cashMove.amount} onChange={e => setCashMove({...cashMove, amount: e.target.value})} className={inputTheme} />
                  <input type="text" placeholder="Motivo (Ex: Troco, Gelo...)" value={cashMove.description} onChange={e => setCashMove({...cashMove, description: e.target.value})} className={inputTheme} />
                  <button
                    onClick={() => {
                      const ipc = getIPC();
                      if(cashMove.amount && cashMove.description && ipc) {
                        ipc.invoke('register-cash', { ...cashMove, amount: parseFloat(cashMove.amount) }).then(() => {
                          setCashMove({ type: 'SAIDA', amount: '', description: '' });
                          loadReports();
                        });
                      }
                    }} 
                    className="w-full bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-gray-900 transition-all"
                  >
                    Registrar Movimento
                  </button>
                </div>
                
                {reportData.movements.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {reportData.movements.map((m, i) => (
                      <div key={i} className={`flex justify-between text-[10px] p-2 rounded ${m.type === 'ENTRADA' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        <span>Total {m.type}</span><span>R$ {m.total_amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 flex flex-col overflow-hidden bg-gray-50">
                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2">
                  {advancedReportData ? 'Produtos Mais Vendidos (Período)' : 'Histórico de Pedidos (Estorno)'}
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                  {advancedReportData ? (
                    advancedReportData.topProducts.map((p, i) => (
                      <div key={i} className="bg-gray-100 border border-gray-300 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-gray-800">{p.product_name}</div>
                          <div className="text-[10px] text-gray-600">{p.qty} vendidos</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-500">R$ {p.total_revenue.toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    ordersHistory.map(o => (
                      <div key={o.id} className="bg-gray-100 border border-gray-300 rounded-xl p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-300 pb-3">
                          <div>
                            <span className="font-bold text-sm text-gray-800 mr-3">{o.customer_name} {o.is_delivery ? '🛵' : ''}</span>
                            <span className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-600 uppercase">{o.payment_method}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-lg text-emerald-500">R$ {o.total.toFixed(2)}</span>
                            <button
                              onClick={() => runWithAuth(() => {
                                const ipc = getIPC();
                                if(window.confirm(`Tem certeza que deseja CANCELAR (estornar) o pedido #${o.id} - ${o.customer_name}?`) && ipc) {
                                  ipc.invoke('delete-order', o.id).then(() => loadReports());
                                }
                              }, 'cancel_orders')}
                              className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-colors flex items-center gap-2"
                              title="Cancelar Pedido"
                            >
                              <Trash2 size={16} /> <span className="text-[10px] font-bold uppercase hidden xl:block">Estornar</span>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {o.items.map(i => (
                            <div key={i.id} className="flex justify-between text-[10px] text-gray-600">
                              <span>1x {i.product_name} <span className="text-gray-500 italic ml-1">{i.notes ? `(${i.notes})` : ''}</span></span>
                              <span className="font-mono">R$ {i.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  {ordersHistory.length === 0 && !advancedReportData && <div className="text-center text-gray-500 text-xs mt-10">Nenhuma venda registrada hoje.</div>}
                  {advancedReportData && advancedReportData.topProducts.length === 0 && <div className="text-center text-gray-500 text-xs mt-10">Nenhum produto vendido no período.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUILDER AÇAÍ */}
      {builder && (
        <div className="fixed inset-0 bg-gray-900/95 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl border border-gray-300 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center px-6">
              <h2 className="font-bold text-sm uppercase tracking-widest text-gray-900">Montagem Personalizada</h2>
              <button onClick={() => setBuilder(null)} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-hidden flex gap-6 p-6">
              <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                <section>
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 border-l-2 border-emerald-500 pl-2">1. Tamanho</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {acaiBases.map(b => (
                      <button key={b.id} onClick={() => setBuilder({...builder, base: b, standard: b.ingredients ? b.ingredients.split(',').map(i=>i.trim()) : []})} className={`p-3 rounded-lg border transition-all text-left ${builder.base?.id === b.id ? 'bg-emerald-600/10 border-emerald-500' : 'bg-gray-100 border-gray-300 hover:border-gray-400'}`}>
                        <div className="font-bold text-xs text-gray-900 uppercase">{b.name}</div>
                        <div className="font-mono text-[10px] text-emerald-500">R${(b.price || 0).toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                </section>
                {builder.standard && builder.standard.length > 0 && (
                  <section className={!builder.base ? 'opacity-20 pointer-events-none' : ''}>
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 border-l-2 border-red-500 pl-2">2. Retiradas</h3>
                    <div className="flex flex-wrap gap-2">
                      {(builder.standard || []).map(ing => (
                        <button key={ing} onClick={() => toggleRemoval(ing)} className={`px-3 py-1.5 rounded-md border text-[9px] font-bold transition-all ${builder.removals.includes(ing) ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-gray-200 border-gray-300 text-gray-600'}`}>
                          {builder.removals.includes(ing) ? 'SEM ' : '+ '} {ing}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section className={!builder.base ? 'opacity-20 pointer-events-none' : ''}>
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 border-l-2 border-orange-500 pl-2">4. Notas e Ajuste</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Observação..." value={builder.obs} onChange={e => setBuilder({...builder, obs: e.target.value})} className={inputTheme} />
                    <div className="bg-gray-100 border border-gray-300 p-3 rounded-xl flex items-center justify-between">
                       <span className="text-[9px] font-bold text-gray-600 uppercase">Ajuste R$</span>
                       <input type="number" step="0.01" value={builder.adjustment} onChange={e => setBuilder({...builder, adjustment: e.target.value})} className="bg-transparent text-right text-lg font-mono text-gray-900 outline-none font-bold w-20 select-auto" />
                    </div>
                  </div>
                </section>
              </div>
              <div className={`flex-1 flex flex-col border-l border-gray-300 pl-6 ${!builder.base ? 'opacity-20 pointer-events-none' : ''}`}>
                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-l-2 border-purple-500 pl-2">3. Adicionais Extras</h3>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 pr-2 custom-scrollbar">
                  {availableAddons.map(a => {
                    const existing = builder.extras.find(e => e.id === a.id);
                    const qty = existing ? existing.qty : 0;
                    return (
                      <div key={a.id} className={`p-3 rounded-xl border transition-all flex items-center justify-between ${qty > 0 ? 'bg-purple-600/10 border-purple-500' : 'bg-gray-100 border-gray-300'}`}>
                        <div className="flex flex-col min-w-0"><span className="font-bold text-[10px] uppercase text-gray-800 truncate">{a.name}</span><span className="font-mono text-emerald-500 text-[9px]">R${(a.price || 0).toFixed(2)}</span></div>
                        <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg border border-gray-300">
                          <button onClick={() => updateExtraInBuilder(a, -1)} className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400">-</button>
                          <span className={`text-xs font-bold w-4 text-center ${qty > 0 ? 'text-purple-400' : 'text-gray-600'}`}>{qty}</span>
                          <button onClick={() => updateExtraInBuilder(a, 1)} className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center hover:bg-gray-400">+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-100 border-t border-gray-300 flex items-center justify-between px-8">
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-300">
                 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Qtd</span>
                 <div className="flex items-center gap-4">
                   <button onClick={() => setBuilder({...builder, quantity: Math.max(1, builder.quantity - 1)})} className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300">-</button>
                   <span className="text-xl font-bold text-emerald-500 w-6 text-center">{builder.quantity}</span>
                   <button onClick={() => setBuilder({...builder, quantity: builder.quantity + 1})} className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300">+</button>
                 </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="text-[9px] font-bold text-gray-600 uppercase mb-0.5 block">Total Montagem</span>
                  <span className="text-3xl font-mono font-black text-emerald-500 italic">
                    R${(((builder.base?.price || 0) + builder.extras.reduce((s,e) => s+(e.price*e.qty), 0) + parseFloat(builder.adjustment || 0)) * builder.quantity).toFixed(2)}
                  </span>
                </div>
                <button disabled={!builder.base} onClick={confirmFullBuild} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 text-slate-950 font-bold py-3 px-8 rounded-xl transition-all active:scale-95">LANÇAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MINI CONSTRUTOR RÁPIDO */}
      {simpleBuilder && (
         <div className="fixed inset-0 bg-gray-900/95 z-[600] flex items-center justify-center p-6 animate-in zoom-in duration-200">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
               <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
                 <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Venda Direta</h2>
                 <button onClick={() => setSimpleBuilder(null)} className="p-1.5 bg-gray-200 rounded-md hover:bg-red-500 text-gray-800 hover:text-white transition-all"><X size={16}/></button>
               </div>
               <div className="text-center mb-8">
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{simpleBuilder.product.name}</h3>
                 <div className="text-emerald-500 font-mono text-lg font-bold">R${(simpleBuilder.product.price || 0).toFixed(2)}</div>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 flex flex-col items-center">
                    <span className="text-[9px] text-gray-600 font-bold uppercase mb-3 tracking-widest">Quantidade</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSimpleBuilder({...simpleBuilder, quantity: Math.max(1, simpleBuilder.quantity - 1)})} className="w-10 h-10 bg-gray-200 rounded-lg font-bold text-xl hover:bg-gray-300 text-gray-900">-</button>
                      <span className="text-2xl font-bold text-gray-900 w-6 text-center">{simpleBuilder.quantity}</span>
                      <button onClick={() => setSimpleBuilder({...simpleBuilder, quantity: simpleBuilder.quantity + 1})} className="w-10 h-10 bg-gray-200 rounded-lg font-bold text-xl hover:bg-gray-300 text-gray-900">+</button>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl border border-orange-500/30 flex flex-col items-center">
                    <span className="text-[9px] text-orange-500 font-bold uppercase mb-3 tracking-widest">Ajuste R$</span>
                    <input type="number" step="0.01" value={simpleBuilder.adjustment} onChange={e => setSimpleBuilder({...simpleBuilder, adjustment: e.target.value})} className="bg-transparent w-full text-center text-2xl font-mono font-bold text-gray-900 outline-none select-auto" placeholder="0.00" />
                  </div>
               </div>
               <input type="text" placeholder="Observações..." value={simpleBuilder.obs} onChange={e => setSimpleBuilder({...simpleBuilder, obs: e.target.value})} className={`${inputTheme} mb-6`} />
               <button onClick={confirmSimpleBuild} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg flex justify-between px-6 items-center transition-all text-slate-950">
                 <span>LANÇAR</span>
                 <span className="font-mono">R${(Math.max(0, simpleBuilder.product.price + parseFloat(simpleBuilder.adjustment || 0)) * simpleBuilder.quantity).toFixed(2)}</span>
               </button>
            </div>
         </div>
      )}

      {/* MODAL: CONFIGURAÇÕES / GESTÃO */}
      {modals.settings && (
        <div className="fixed inset-0 bg-gray-900/95 z-[900] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl border border-gray-300 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center px-6">
              <div className="flex gap-4">
                <button onClick={() => setSettingsTab('products')} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'products' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Produtos</button>
                <button onClick={() => setSettingsTab('promotions')} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'promotions' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Promoções</button>
                <button onClick={() => setSettingsTab('security')} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'security' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Segurança</button>
                <button onClick={() => { setSettingsTab('users'); loadUsers(); }} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'users' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Usuários</button>
                <button onClick={() => { setSettingsTab('inventory'); loadInventory(); }} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'inventory' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Estoque</button>
                <button onClick={() => { setSettingsTab('financial'); loadFinancialAccounts(); }} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'financial' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Financeiro</button>
                <button onClick={() => { setSettingsTab('clients'); loadClients(); }} className={`text-xs font-bold uppercase tracking-widest transition-all ${settingsTab === 'clients' ? 'text-emerald-500' : 'text-gray-600 hover:text-gray-900'}`}>Clientes</button>
              </div>
              <button onClick={() => setModals({...modals, settings: false})} className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {settingsTab === 'products' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                
                <section className="mb-10">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Gerenciar Categorias</h3>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Nova Categoria..." 
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      className={inputTheme}
                    />
                    <button
                      onClick={() => {
                        const ipc = getIPC();
                        if(!newCatName) return;
                        if (ipc) {
                          ipc.invoke('add-category', newCatName.toUpperCase()).then(() => {
                            setNewCatName('');
                            syncDB();
                          });
                        }
                      }}
                      className="p-2 bg-emerald-600 text-slate-950 rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center shrink-0"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex justify-between items-center bg-gray-100/50 p-2 rounded border border-gray-300/50 group">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">{cat.name}</span>
                        <button
                          onClick={() => {
                            const ipc = getIPC();
                            if(window.confirm(`Excluir categoria ${cat.name}?`) && ipc) {
                              ipc.invoke('delete-category', cat.id).then(() => syncDB());
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-6 tracking-widest border-b border-gray-300 pb-2">
                  {newProd.id ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <form onSubmit={e => {
                  e.preventDefault();
                  const ipc = getIPC();
                  if (ipc && newProd.name) {
                    const payload = { ...newProd, price: parseFloat(newProd.price) };
                    if (newProd.id) {
                      ipc.invoke('update-product', { id: newProd.id, product: payload }).then(res => {
                        if (res && res.success) { setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' }); syncDB(); }
                      });
                    } else {
                      ipc.invoke('add-product', payload).then(res => {
                        if (res && res.success) { setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' }); syncDB(); }
                      });
                    }
                  }
                }} className="space-y-4 select-text">
                  <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome</label><input type="text" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className={inputTheme} required /></div>
                  <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Ficha Técnica</label><input type="text" placeholder="Ingredientes padrão..." value={newProd.ingredients} onChange={e => setNewProd({...newProd, ingredients: e.target.value})} className={inputTheme} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Preço</label><input type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} className={inputTheme} required /></div>
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Categoria</label>
                      <input type="text" list="cat-list-adm" value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} className={inputTheme} required />
                      <datalist id="cat-list-adm">
                        {categories.map(c => <option key={c.id} value={c.name}/>)}
                        <option value="ADICIONAIS DOCES"/>
                      </datalist>
                    </div>
                  </div>
                  <button type="submit" className={`w-full ${newProd.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
                    {newProd.id ? 'Atualizar Produto' : 'Salvar Produto'}
                  </button>
                  {newProd.id && (
                    <button type="button" onClick={() => setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' })} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
                  )}
                </form>

              </div>
              
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Produtos Cadastrados</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {safeCatalog.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-100 border border-gray-300 p-3 rounded-lg">
                      <div>
                        <div className="font-bold text-xs uppercase text-gray-800">{p.name}</div>
                        <div className="text-[9px] text-gray-600 uppercase">{p.category} - R$ {(p.price || 0).toFixed(2)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => runWithAuth(() => setNewProd({ id: p.id, name: p.name, price: p.price.toString(), category: p.category, ingredients: p.ingredients || '' }), 'edit_products')} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button
                          onClick={() => runWithAuth(() => {
                            const ipc = getIPC();
                            if(window.confirm(`Excluir ${p.name}?`) && ipc) {
                              ipc.invoke('delete-product', p.id).then(() => syncDB());
                            }
                          }, 'delete_products')}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
              ) : settingsTab === 'promotions' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">
                    {newPromo.id ? 'Editar Promoção' : 'Nova Promoção'}
                  </h3>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const ipc = getIPC();
                    if (ipc && newPromo.name) {
                      const payload = {
                        ...newPromo,
                        value: parseFloat(newPromo.value),
                        min_quantity: parseInt(newPromo.min_quantity),
                        target_product_id: newPromo.target_product_id ? parseInt(newPromo.target_product_id) : null
                      };
                      if (newPromo.id) {
                        ipc.invoke('update-promotion', { id: newPromo.id, promo: payload }).then(res => {
                          if (res && res.success) { setNewPromo({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true }); syncDB(); }
                        });
                      } else {
                        ipc.invoke('add-promotion', payload).then(res => {
                          if (res && res.success) { setNewPromo({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true }); syncDB(); }
                        });
                      }
                    }
                  }} className="space-y-3 select-text">
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome</label><input type="text" value={newPromo.name} onChange={e => setNewPromo({...newPromo, name: e.target.value})} className={inputTheme} required /></div>
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Tipo</label>
                      <select value={newPromo.type} onChange={e => setNewPromo({...newPromo, type: e.target.value})} className={inputTheme} required>
                        <option value="PERCENTAGE">Porcentagem (%)</option>
                        <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
                        <option value="BUY_X_GET_Y">Compre X Leve Y</option>
                      </select>
                    </div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Valor</label><input type="number" step="0.01" value={newPromo.value} onChange={e => setNewPromo({...newPromo, value: e.target.value})} className={inputTheme} required /></div>
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Aplica-se a</label>
                      <select value={newPromo.applies_to} onChange={e => setNewPromo({...newPromo, applies_to: e.target.value})} className={inputTheme} required>
                        <option value="ALL">Todos os Produtos</option>
                        <option value="CATEGORY">Categoria Específica</option>
                        <option value="SPECIFIC_PRODUCT">Produto Específico</option>
                      </select>
                    </div>
                    {newPromo.applies_to === 'CATEGORY' && (
                      <div>
                        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Categoria</label>
                        <select value={newPromo.target_category} onChange={e => setNewPromo({...newPromo, target_category: e.target.value})} className={inputTheme} required>
                          <option value="">Selecione...</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    {newPromo.applies_to === 'SPECIFIC_PRODUCT' && (
                      <div>
                        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Produto ID</label>
                        <input type="number" value={newPromo.target_product_id} onChange={e => setNewPromo({...newPromo, target_product_id: e.target.value})} className={inputTheme} required />
                      </div>
                    )}
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Qtd Mínima</label><input type="number" value={newPromo.min_quantity} onChange={e => setNewPromo({...newPromo, min_quantity: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Data Início</label><input type="datetime-local" value={newPromo.start_date} onChange={e => setNewPromo({...newPromo, start_date: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Data Fim</label><input type="datetime-local" value={newPromo.end_date} onChange={e => setNewPromo({...newPromo, end_date: e.target.value})} className={inputTheme} required /></div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="promo-active" checked={newPromo.is_active} onChange={e => setNewPromo({...newPromo, is_active: e.target.checked})} className="w-4 h-4" />
                      <label htmlFor="promo-active" className="text-[9px] text-gray-600 font-bold uppercase">Ativo</label>
                    </div>
                    <button type="submit" className={`w-full ${newPromo.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
                      {newPromo.id ? 'Atualizar Promoção' : 'Criar Promoção'}
                    </button>
                    {newPromo.id && (
                      <button type="button" onClick={() => setNewPromo({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true })} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
                    )}
                  </form>
                </div>
                
                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Promoções Cadastradas</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {promotions.map(p => (
                      <div key={p.id} className={`flex items-center justify-between bg-gray-100 border p-3 rounded-lg ${!p.is_active ? 'border-gray-400 opacity-60' : 'border-gray-300'}`}>
                        <div>
                          <div className="font-bold text-xs uppercase text-gray-800">{p.name}</div>
                          <div className="text-[9px] text-gray-600 uppercase">{p.type} - {p.applies_to} {p.value}{p.type === 'PERCENTAGE' ? '%' : 'R$'}</div>
                          <div className="text-[8px] text-gray-500">{new Date(p.start_date).toLocaleDateString()} até {new Date(p.end_date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => runWithAuth(() => setNewPromo({ id: p.id, name: p.name, type: p.type, value: p.value.toString(), applies_to: p.applies_to, target_category: p.target_category || '', target_product_id: p.target_product_id || '', min_quantity: p.min_quantity.toString(), start_date: p.start_date, end_date: p.end_date, is_active: p.is_active }), 'edit_promotions')} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                          <button
                            onClick={() => runWithAuth(() => {
                              const ipc = getIPC();
                              if(window.confirm(`Excluir promoção ${p.name}?`) && ipc) {
                                ipc.invoke('delete-promotion', p.id).then(() => syncDB());
                              }
                            }, 'delete_promotions')}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </>
              ) : settingsTab === 'security' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Alterar Senha</h3>
                  <div className="space-y-3">
                    <input type="password" placeholder="Senha Atual" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className={inputTheme} />
                    <input type="password" placeholder="Nova Senha" value={pwdForm.next} onChange={e => setPwdForm({...pwdForm, next: e.target.value})} className={inputTheme} />
                    <button
                      onClick={() => {
                        const ipc = getIPC();
                        if(!pwdForm.current || !pwdForm.next || !ipc) return;
                        ipc.invoke('update-password', { current: pwdForm.current, next: pwdForm.next }).then(res => {
                          if(res.success) {
                            alert('Senha atualizada com sucesso!');
                            setPwdForm({ current: '', next: '' });
                          } else {
                            alert('Erro: ' + res.error);
                          }
                        });
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-950 transition-all"
                    >
                      Alterar Senha
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Informações de Segurança</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg">
                      <div className="font-bold text-xs uppercase text-gray-800 mb-2">Senha de Gerente</div>
                      <div className="text-[10px] text-gray-600">A senha de gerente é necessária para:</div>
                      <ul className="text-[9px] text-gray-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Editar produtos</li>
                        <li>Excluir produtos</li>
                        <li>Editar promoções</li>
                        <li>Cancelar pedidos (estorno)</li>
                      </ul>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
                      <div className="font-bold text-xs uppercase text-emerald-600 mb-2">Dica de Segurança</div>
                      <div className="text-[10px] text-gray-600">Mantenha sua senha segura e altere-a regularmente. A senha padrão é "1234".</div>
                    </div>
                  </div>
                </div>
                </>
              ) : settingsTab === 'users' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">
                    {newUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const ipc = getIPC();
                    if (ipc && newUser.username && newUser.password && newUser.full_name) {
                      const payload = {
                        username: newUser.username,
                        password: newUser.password,
                        full_name: newUser.full_name,
                        role: newUser.role
                      };
                      if (newUser.id) {
                        ipc.invoke('update-user', { id: newUser.id, user: payload }).then(res => {
                          if (res && res.success) { setNewUser({ id: null, username: '', password: '', full_name: '', role: 'operator' }); loadUsers(); }
                        });
                      } else {
                        ipc.invoke('add-user', payload).then(res => {
                          if (res && res.success) { setNewUser({ id: null, username: '', password: '', full_name: '', role: 'operator' }); loadUsers(); }
                        });
                      }
                    }
                  }} className="space-y-3 select-text">
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome Completo</label><input type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Usuário</label><input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Senha</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={inputTheme} required /></div>
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Função</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className={inputTheme} required>
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="operator">Operador</option>
                      </select>
                    </div>
                    <button type="submit" className={`w-full ${newUser.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
                      {newUser.id ? 'Atualizar Usuário' : 'Criar Usuário'}
                    </button>
                    {newUser.id && (
                      <button type="button" onClick={() => setNewUser({ id: null, username: '', password: '', full_name: '', role: 'operator' })} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
                    )}
                  </form>
                </div>

                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Usuários Cadastrados</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {users.map(u => (
                      <div key={u.id} className={`flex items-center justify-between bg-gray-100 border p-3 rounded-lg ${!u.is_active ? 'border-gray-400 opacity-60' : 'border-gray-300'}`}>
                        <div>
                          <div className="font-bold text-xs uppercase text-gray-800">{u.full_name}</div>
                          <div className="text-[9px] text-gray-600 uppercase">@{u.username} • {u.role}</div>
                          <div className="text-[8px] text-gray-500">Criado em: {new Date(u.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setNewUser({ id: u.id, username: u.username, password: '', full_name: u.full_name, role: u.role })} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                          <button
                            onClick={() => {
                              const ipc = getIPC();
                              if(window.confirm(`${u.is_active ? 'Desativar' : 'Ativar'} usuário ${u.full_name}?`) && ipc) {
                                ipc.invoke('toggle-user-active', u.id).then(() => loadUsers());
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${u.is_active ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'}`}
                          >
                            {u.is_active ? <X size={16} /> : <Check size={16} />}
                          </button>
                          <button
                            onClick={() => {
                              const ipc = getIPC();
                              if(window.confirm(`Excluir usuário ${u.full_name}?`) && ipc) {
                                ipc.invoke('delete-user', u.id).then(() => loadUsers());
                              }
                            }}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </>
              ) : settingsTab === 'inventory' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">
                    {selectedInventoryItem ? 'Editar Estoque' : 'Adicionar ao Estoque'}
                  </h3>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const ipc = getIPC();
                    if (ipc && inventoryForm.productId && inventoryForm.quantity) {
                      const payload = {
                        productId: parseInt(inventoryForm.productId),
                        quantity: parseFloat(inventoryForm.quantity),
                        unit: inventoryForm.unit,
                        minQuantity: parseFloat(inventoryForm.minQuantity) || 0
                      };
                      ipc.invoke('add-inventory', payload).then(res => {
                        if (res && res.success) {
                          setInventoryForm({ productId: '', quantity: '', unit: 'un', minQuantity: '' });
                          loadInventory();
                        }
                      });
                    }
                  }} className="space-y-3 select-text">
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Produto</label>
                      <select value={inventoryForm.productId} onChange={e => setInventoryForm({...inventoryForm, productId: e.target.value})} className={inputTheme} required>
                        <option value="">Selecione...</option>
                        {safeCatalog.filter(p => p.category !== 'ADICIONAIS DOCES').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Quantidade</label><input type="number" step="0.01" value={inventoryForm.quantity} onChange={e => setInventoryForm({...inventoryForm, quantity: e.target.value})} className={inputTheme} required /></div>
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Unidade</label>
                      <select value={inventoryForm.unit} onChange={e => setInventoryForm({...inventoryForm, unit: e.target.value})} className={inputTheme}>
                        <option value="un">Unidade</option>
                        <option value="kg">Quilograma</option>
                        <option value="l">Litro</option>
                        <option value="cx">Caixa</option>
                      </select>
                    </div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Estoque Mínimo</label><input type="number" step="0.01" value={inventoryForm.minQuantity} onChange={e => setInventoryForm({...inventoryForm, minQuantity: e.target.value})} className={inputTheme} /></div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95">Adicionar ao Estoque</button>
                  </form>
                </div>

                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Estoque Atual</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {inventory.map(inv => (
                      <div key={inv.id} className={`flex items-center justify-between bg-gray-100 border p-3 rounded-lg ${inv.quantity <= inv.min_quantity ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}>
                        <div>
                          <div className="font-bold text-xs uppercase text-gray-800">{inv.product_name}</div>
                          <div className="text-[9px] text-gray-600 uppercase">{inv.category} • {inv.quantity} {inv.unit}</div>
                          {inv.quantity <= inv.min_quantity && <div className="text-[8px] text-orange-500 font-bold uppercase mt-1">⚠️ Estoque Baixo</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedInventoryItem(inv); loadInventoryMovements(inv.id); }} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors" title="Ver Histórico"><FileText size={16} /></button>
                          <button
                            onClick={() => {
                              const ipc = getIPC();
                              if(window.confirm(`Ajustar estoque de ${inv.product_name}?`) && ipc) {
                                const delta = prompt('Quantidade a adicionar (positivo) ou remover (negativo):', '0');
                                if (delta) {
                                  ipc.invoke('adjust-inventory', { inventoryId: inv.id, delta: parseFloat(delta), reason: 'Ajuste manual' }).then(() => loadInventory());
                                }
                              }
                            }}
                            className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg transition-colors"
                            title="Ajustar Estoque"
                          >
                            <ArrowUpCircle size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </>
              ) : settingsTab === 'financial' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">
                    {financialForm.id ? 'Editar Conta' : 'Nova Conta'}
                  </h3>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const ipc = getIPC();
                    if (ipc && financialForm.description && financialForm.amount) {
                      const payload = {
                        type: financialForm.type,
                        description: financialForm.description,
                        amount: parseFloat(financialForm.amount),
                        due_date: financialForm.due_date || null,
                        status: financialForm.status,
                        category: financialForm.category || null
                      };
                      if (financialForm.id) {
                        ipc.invoke('update-financial-account', { id: financialForm.id, account: payload }).then(res => {
                          if (res && res.success) { setFinancialForm({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' }); loadFinancialAccounts(); }
                        });
                      } else {
                        ipc.invoke('add-financial-account', payload).then(res => {
                          if (res && res.success) { setFinancialForm({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' }); loadFinancialAccounts(); }
                        });
                      }
                    }
                  }} className="space-y-3 select-text">
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Tipo</label>
                      <select value={financialForm.type} onChange={e => setFinancialForm({...financialForm, type: e.target.value})} className={inputTheme}>
                        <option value="payable">A Pagar</option>
                        <option value="receivable">A Receber</option>
                      </select>
                    </div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Descrição</label><input type="text" value={financialForm.description} onChange={e => setFinancialForm({...financialForm, description: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Valor</label><input type="number" step="0.01" value={financialForm.amount} onChange={e => setFinancialForm({...financialForm, amount: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Data Vencimento</label><input type="date" value={financialForm.due_date} onChange={e => setFinancialForm({...financialForm, due_date: e.target.value})} className={inputTheme} /></div>
                    <div>
                      <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Status</label>
                      <select value={financialForm.status} onChange={e => setFinancialForm({...financialForm, status: e.target.value})} className={inputTheme}>
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Categoria</label><input type="text" value={financialForm.category} onChange={e => setFinancialForm({...financialForm, category: e.target.value})} className={inputTheme} placeholder="Ex: Fornecedor, Cliente..." /></div>
                    <button type="submit" className={`w-full ${financialForm.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
                      {financialForm.id ? 'Atualizar Conta' : 'Criar Conta'}
                    </button>
                    {financialForm.id && (
                      <button type="button" onClick={() => setFinancialForm({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' })} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
                    )}
                  </form>
                </div>

                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-4 mb-4 border-b border-gray-300 pb-4">
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Contas Financeiras</h3>
                    <div className="flex gap-2">
                      <select value={financialFilter.type} onChange={e => { setFinancialFilter({...financialFilter, type: e.target.value}); }} className="text-[9px] border border-gray-300 rounded px-2 py-1">
                        <option value="all">Todos Tipos</option>
                        <option value="payable">A Pagar</option>
                        <option value="receivable">A Receber</option>
                      </select>
                      <select value={financialFilter.status} onChange={e => { setFinancialFilter({...financialFilter, status: e.target.value}); }} className="text-[9px] border border-gray-300 rounded px-2 py-1">
                        <option value="all">Todos Status</option>
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                      <button onClick={loadFinancialAccounts} className="text-[9px] bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded font-bold">Filtrar</button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {financialAccounts.map(acc => (
                      <div key={acc.id} className={`flex items-center justify-between bg-gray-100 border p-3 rounded-lg ${acc.status === 'paid' ? 'border-emerald-500 bg-emerald-50' : acc.status === 'cancelled' ? 'border-gray-400 opacity-60' : acc.due_date && new Date(acc.due_date) < new Date() ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                        <div>
                          <div className="font-bold text-xs uppercase text-gray-800">{acc.description}</div>
                          <div className="text-[9px] text-gray-600 uppercase">{acc.type === 'payable' ? 'A Pagar' : 'A Receber'} • R$ {acc.amount.toFixed(2)}</div>
                          <div className="text-[8px] text-gray-500">Vencimento: {acc.due_date ? new Date(acc.due_date).toLocaleDateString() : 'N/A'} • {acc.status}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setFinancialForm({ id: acc.id, type: acc.type, description: acc.description, amount: acc.amount.toString(), due_date: acc.due_date || '', status: acc.status, category: acc.category || '' })} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                          <button
                            onClick={() => {
                              const ipc = getIPC();
                              if(window.confirm(`Excluir conta ${acc.description}?`) && ipc) {
                                ipc.invoke('delete-financial-account', acc.id).then(() => loadFinancialAccounts());
                              }
                            }}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </>
              ) : settingsTab === 'clients' ? (
                <>
                <div className="w-80 p-6 border-r border-gray-300 bg-white overflow-y-auto custom-scrollbar">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">
                    {clientForm.id ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const ipc = getIPC();
                    if (ipc && clientForm.name) {
                      const payload = {
                        name: clientForm.name,
                        phone: clientForm.phone,
                        address: clientForm.address,
                        email: clientForm.email,
                        notes: clientForm.notes
                      };
                      if (clientForm.id) {
                        ipc.invoke('update-client', { id: clientForm.id, client: payload }).then(res => {
                          if (res && res.success) { setClientForm({ id: null, name: '', phone: '', address: '', email: '', notes: '' }); loadClients(); }
                        });
                      } else {
                        ipc.invoke('add-client', payload).then(res => {
                          if (res && res.success) { setClientForm({ id: null, name: '', phone: '', address: '', email: '', notes: '' }); loadClients(); }
                        });
                      }
                    }
                  }} className="space-y-3 select-text">
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome</label><input type="text" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className={inputTheme} required /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Telefone</label><input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className={inputTheme} /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Endereço</label><input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className={inputTheme} /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Email</label><input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className={inputTheme} /></div>
                    <div><label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Observações</label><textarea value={clientForm.notes} onChange={e => setClientForm({...clientForm, notes: e.target.value})} className={inputTheme} rows="2" /></div>
                    <button type="submit" className={`w-full ${clientForm.id ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all mt-4 active:scale-95`}>
                      {clientForm.id ? 'Atualizar Cliente' : 'Criar Cliente'}
                    </button>
                    {clientForm.id && (
                      <button type="button" onClick={() => setClientForm({ id: null, name: '', phone: '', address: '', email: '', notes: '' })} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
                    )}
                  </form>
                </div>

                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-300 pb-2">Clientes Cadastrados</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {clients.map(client => (
                      <div key={client.id} className="flex items-center justify-between bg-gray-100 border border-gray-300 p-3 rounded-lg">
                        <div>
                          <div className="font-bold text-xs uppercase text-gray-800">{client.name}</div>
                          <div className="text-[9px] text-gray-600 uppercase">{client.phone || 'Sem telefone'} • {client.email || 'Sem email'}</div>
                          <div className="text-[8px] text-gray-500">Cadastrado em: {new Date(client.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setClientForm({ id: client.id, name: client.name, phone: client.phone || '', address: client.address || '', email: client.email || '', notes: client.notes || '' }); loadClientOrders(client.id); }} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                          <button
                            onClick={() => {
                              const ipc = getIPC();
                              if(window.confirm(`Excluir cliente ${client.name}?`) && ipc) {
                                ipc.invoke('delete-client', client.id).then(() => loadClients());
                              }
                            }}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedClientOrders.length > 0 && (
                    <div className="mt-4 border-t border-gray-300 pt-4">
                      <h4 className="text-[9px] font-bold text-gray-600 uppercase mb-2">Histórico de Pedidos</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                        {selectedClientOrders.map(order => (
                          <div key={order.id} className="text-[8px] text-gray-600 bg-gray-50 p-2 rounded">
                            {new Date(order.created_at).toLocaleDateString()} - R$ {order.total_amount.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHECKOUT */}
      {modals.checkout && (
        <div className="fixed inset-0 bg-gray-900/95 z-[800] flex items-center justify-center p-6 animate-in zoom-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Caixa: {activeTable.name}</h2>
              <button onClick={() => setModals({...modals, checkout: false})} className="p-1.5 bg-gray-200 rounded-md hover:bg-red-500 text-gray-800 hover:text-white transition-all"><X size={16}/></button>
            </div>
            
            <div className="text-center mb-6">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Total a Pagar</span>
              <span className="text-4xl font-black text-emerald-500 font-mono tracking-tighter">R$ {((activeTable.total || 0) - (selectedPromotion ? calculateDiscount(selectedPromotion, activeTable.total) : 0)).toFixed(2)}</span>
            </div>

            <div className="mb-6">
              <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-2 block">Promoção</label>
              <select 
                value={selectedPromotion?.id || ''} 
                onChange={e => {
                  const promo = promotions.find(p => p.id === parseInt(e.target.value));
                  setSelectedPromotion(promo || null);
                }}
                className={inputTheme}
              >
                <option value="">Sem promoção</option>
                {promotions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type === 'PERCENTAGE' ? p.value + '%' : 'R$' + p.value})</option>
                ))}
              </select>
              {selectedPromotion && (
                <div className="mt-2 text-[9px] text-emerald-500 font-bold uppercase">
                  Desconto: R$ {calculateDiscount(selectedPromotion, activeTable.total).toFixed(2)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {['DINHEIRO', 'PIX', 'DÉBITO', 'CRÉDITO'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-lg border font-bold text-[10px] transition-all ${paymentMethod === m ? 'bg-emerald-600 border-emerald-400 text-slate-950' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-2 block">Dinheiro Recebido</label>
              <input type="number" step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className={`${inputTheme} text-2xl text-center font-mono`} placeholder="0.00" />
              {amountReceived && parseFloat(amountReceived) >= activeTable.total && (
                <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-center animate-in fade-in">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Troco a Devolver</span>
                  <span className="text-2xl font-bold text-orange-500 font-mono">R$ {(parseFloat(amountReceived) - activeTable.total).toFixed(2)}</span>
                </div>
              )}
            </div>
            <button onClick={handleFinalize} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-95">
              <Check size={18} /> Confirmar & Imprimir
            </button>
          </div>
        </div>
      )}

      {/* MODAL: LOGIN */}
      {modals.login && (
        <div className="fixed inset-0 bg-gray-900/98 z-[2000] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl border border-gray-300 w-96 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <Lock size={40} className="text-emerald-500"/>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Acai Turbo PDV</h2>
              <p className="text-gray-600 text-sm">Faça login para acessar o sistema</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Usuário</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
                  placeholder="Digite seu usuário"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Senha</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
                  placeholder="Digite sua senha"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-slate-950 transition-all active:scale-95"
              >
                Entrar
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[10px] text-gray-500">
                Usuário padrão: <span className="font-bold text-gray-700">admin</span>
                <br />
                Senha padrão: <span className="font-bold text-gray-700">admin123</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {modals.changePassword && (
        <div className="fixed inset-0 bg-gray-900/98 z-[2000] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl border border-gray-300 w-96 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                <Lock size={40} className="text-orange-500"/>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Alterar Senha</h2>
              <p className="text-gray-600 text-sm">Você deve alterar sua senha para continuar</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Senha Atual</label>
                <input
                  type="password"
                  value={changePasswordForm.current}
                  onChange={e => setChangePasswordForm({...changePasswordForm, current: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
                  placeholder="Digite sua senha atual"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nova Senha</label>
                <input
                  type="password"
                  value={changePasswordForm.new}
                  onChange={e => setChangePasswordForm({...changePasswordForm, new: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
                  placeholder="Digite sua nova senha"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={changePasswordForm.confirm}
                  onChange={e => setChangePasswordForm({...changePasswordForm, confirm: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-95"
              >
                Alterar Senha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VALIDAÇÃO DE SENHA (GERENTE) */}
      {showPassModal.show && (
        <div className="fixed inset-0 bg-gray-900/98 z-[1000] flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl border border-gray-300 w-80 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Lock size={32} className="text-emerald-500"/>
            </div>
            <h3 className="text-gray-900 font-bold mb-1 uppercase tracking-widest text-xs">Autorização</h3>
            <p className="text-gray-600 text-[10px] mb-6">Digite a senha de gerente para prosseguir</p>
            
            <input 
              type="password" 
              placeholder="****"
              className="w-full bg-gray-100 border border-gray-300 p-4 rounded-xl text-center text-2xl tracking-[1em] text-gray-900 outline-none focus:border-emerald-500 mb-6"
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const ipc = getIPC();
                  if (ipc) {
                    const res = await ipc.invoke('verify-password', e.target.value);
                    if (res.valid) {
                      setAuthTime(Date.now());
                      showPassModal.onResult();
                      setShowPassModal({ show: false, onResult: null });
                    } else {
                      alert("Senha Incorreta");
                      e.target.value = "";
                    }
                  }
                }
              }}
            />
            <button onClick={() => setShowPassModal({ show: false, onResult: null })} className="text-[10px] font-bold text-gray-600 uppercase hover:text-gray-900 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
