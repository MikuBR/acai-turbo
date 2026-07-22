import React from 'react';
import { Pencil, Trash2, X, Check, FileText, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import SettingsTabs from '../molecules/SettingsTabs';
import ProductForm from '../forms/ProductForm';
import PromotionForm from '../forms/PromotionForm';
import UserForm from '../forms/UserForm';
import InventoryForm from '../forms/InventoryForm';
import FinancialForm from '../forms/FinancialForm';
import ClientForm from '../forms/ClientForm';
import CategoryForm from '../forms/CategoryForm';
import ModalHeader from '../molecules/ModalHeader';

export default function SettingsModal({ isOpen, onClose, settingsTab, setSettingsTab, safeCatalog, categories, newCatName, setNewCatName, newProd, setNewProd, newPromo, setNewPromo, users, newUser, setNewUser, inventory, inventoryForm, setInventoryForm, selectedInventoryItem, setSelectedInventoryItem, inventoryMovements, loadInventoryMovements, financialAccounts, financialForm, setFinancialForm, financialFilter, setFinancialFilter, clients, clientForm, setClientForm, selectedClientOrders, promotions, pwdForm, setPwdForm, syncDB, loadUsers, loadInventory, loadFinancialAccounts, loadClients, loadClientOrders, runWithAuth, getIPC, inputTheme }) {
  if (!isOpen) return null;

  const handleAddCategory = () => {
    const ipc = getIPC();
    if (!newCatName) return;
    if (ipc) {
      ipc.invoke('catalog:add-category', newCatName.toUpperCase()).then(() => {
        setNewCatName('');
        syncDB();
      });
    }
  };

  const handleDeleteCategory = (cat) => {
    const ipc = getIPC();
    if (window.confirm(`Excluir categoria ${cat.name}?`) && ipc) {
      ipc.invoke('catalog:delete-category', cat.id).then(() => syncDB());
    }
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const ipc = getIPC();
    if (ipc && newProd.name) {
      const payload = { ...newProd, price: parseFloat(newProd.price) };
      if (newProd.id) {
        ipc.invoke('catalog:update-product', { id: newProd.id, product: payload }).then(res => {
          if (res && res.success) { setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' }); syncDB(); }
        });
      } else {
        ipc.invoke('catalog:add-product', payload).then(res => {
          if (res && res.success) { setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' }); syncDB(); }
        });
      }
    }
  };

  const handlePromoSubmit = (e) => {
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
        ipc.invoke('promotions:update', { id: newPromo.id, promo: payload }).then(() => syncDB());
      } else {
        ipc.invoke('promotions:add', payload).then(() => syncDB());
      }
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    const ipc = getIPC();
    if (ipc && newUser.username && newUser.password && newUser.full_name) {
      const payload = { username: newUser.username, password: newUser.password, full_name: newUser.full_name, role: newUser.role };
      if (newUser.id) {
        ipc.invoke('users:update', { id: newUser.id, user: payload }).then(() => loadUsers());
      } else {
        ipc.invoke('users:add', payload).then(() => loadUsers());
      }
    }
  };

  const handleInventorySubmit = (e) => {
    e.preventDefault();
    const ipc = getIPC();
    if (ipc && inventoryForm.productId && inventoryForm.quantity) {
      const payload = { productId: parseInt(inventoryForm.productId), quantity: parseFloat(inventoryForm.quantity), unit: inventoryForm.unit, minQuantity: parseFloat(inventoryForm.minQuantity) || 0 };
      ipc.invoke('inventory:add', payload).then(() => {
        setInventoryForm({ productId: '', quantity: '', unit: 'un', minQuantity: '' });
        loadInventory();
      });
    }
  };

  const handleFinancialSubmit = (e) => {
    e.preventDefault();
    const ipc = getIPC();
    if (ipc && financialForm.description && financialForm.amount) {
      const payload = { type: financialForm.type, description: financialForm.description, amount: parseFloat(financialForm.amount), due_date: financialForm.due_date || null, status: financialForm.status, category: financialForm.category || null };
      if (financialForm.id) {
        ipc.invoke('financial:update-account', { id: financialForm.id, account: payload }).then(() => loadFinancialAccounts());
      } else {
        ipc.invoke('financial:add-account', payload).then(() => loadFinancialAccounts());
      }
    }
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    const ipc = getIPC();
    if (ipc && clientForm.name) {
      const payload = { name: clientForm.name, phone: clientForm.phone, address: clientForm.address, email: clientForm.email, notes: clientForm.notes };
      if (clientForm.id) {
        ipc.invoke('clients:update', { id: clientForm.id, client: payload }).then(() => loadClients());
      } else {
        ipc.invoke('clients:add', payload).then(() => loadClients());
      }
    }
  };

  const handlePasswordChange = () => {
    const ipc = getIPC();
    if (!pwdForm.current || !pwdForm.next || !ipc) return;
    ipc.invoke('auth:update-password', { current: pwdForm.current, next: pwdForm.next }).then(res => {
      if (res.success) { alert('Senha atualizada com sucesso!'); setPwdForm({ current: '', next: '' }); }
      else { alert('Erro: ' + res.error); }
    });
  };

  return (
    <div className="fixed inset-0 bg-surface z-[900] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-5xl h-[80vh] rounded-2xl border border-border flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 bg-surface-light border-b border-border flex justify-between items-center px-6">
          <SettingsTabs activeTab={settingsTab} onTabChange={setSettingsTab} />
          <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 rounded-md text-muted hover:text-red-500 transition-all"><X size={20}/></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {settingsTab === 'products' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <CategoryForm newCatName={newCatName} setNewCatName={setNewCatName} categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} inputTheme={inputTheme} />
                <h3 className="text-[10px] font-bold text-muted uppercase mb-6 tracking-widest border-b border-border pb-2">{newProd.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <ProductForm newProd={newProd} setNewProd={setNewProd} categories={categories} onSubmit={handleProductSubmit} onCancel={() => setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' })} inputTheme={inputTheme} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Produtos Cadastrados</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {safeCatalog.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-surface-light border border-border p-3 rounded-lg">
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{p.name}</div>
                        <div className="text-[9px] text-muted uppercase">{p.category} - R$ {(p.price || 0).toFixed(2)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => runWithAuth(() => setNewProd({ id: p.id, name: p.name, price: p.price.toString(), category: p.category, ingredients: p.ingredients || '' }), 'edit_products')} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => runWithAuth(() => { const ipc = getIPC(); if(window.confirm(`Excluir ${p.name}?`) && ipc) { ipc.invoke('catalog:delete-product', p.id).then(() => syncDB()); } }, 'delete_products')} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {settingsTab === 'promotions' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">{newPromo.id ? 'Editar Promoção' : 'Nova Promoção'}</h3>
                <PromotionForm newPromo={newPromo} setNewPromo={setNewPromo} categories={categories} onSubmit={handlePromoSubmit} onCancel={() => setNewPromo({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true })} inputTheme={inputTheme} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Promoções Cadastradas</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {promotions.map(p => (
                    <div key={p.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${!p.is_active ? 'border-gray-400 opacity-60' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{p.name}</div>
                        <div className="text-[9px] text-muted uppercase">{p.type} - {p.applies_to} {p.value}{p.type === 'PERCENTAGE' ? '%' : 'R$'}</div>
                        <div className="text-[8px] text-muted">{new Date(p.start_date).toLocaleDateString()} até {new Date(p.end_date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => runWithAuth(() => setNewPromo({ id: p.id, name: p.name, type: p.type, value: p.value.toString(), applies_to: p.applies_to, target_category: p.target_category || '', target_product_id: p.target_product_id || '', min_quantity: p.min_quantity.toString(), start_date: p.start_date, end_date: p.end_date, is_active: p.is_active }), 'edit_promotions')} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => runWithAuth(() => { const ipc = getIPC(); if(window.confirm(`Excluir promoção ${p.name}?`) && ipc) { ipc.invoke('promotions:delete', p.id).then(() => syncDB()); } }, 'delete_promotions')} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {settingsTab === 'security' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">Alterar Senha</h3>
                <div className="space-y-3">
                  <input type="password" placeholder="Senha Atual" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className={inputTheme} />
                  <input type="password" placeholder="Nova Senha" value={pwdForm.next} onChange={e => setPwdForm({...pwdForm, next: e.target.value})} className={inputTheme} />
                  <button onClick={handlePasswordChange} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-950 transition-all">Alterar Senha</button>
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Informações de Segurança</h3>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                  <div className="bg-surface-light border border-border p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase text-primary mb-2">Senha de Gerente</div>
                    <div className="text-[10px] text-muted">A senha de gerente é necessária para:</div>
                    <ul className="text-[9px] text-muted mt-2 space-y-1 list-disc list-inside">
                      <li>Editar produtos</li>
                      <li>Excluir produtos</li>
                      <li>Editar promoções</li>
                      <li>Cancelar pedidos (estorno)</li>
                    </ul>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase text-emerald-600 mb-2">Dica de Segurança</div>
                    <div className="text-[10px] text-muted">Mantenha sua senha segura e altere-a regularmente. A senha padrão é "1234".</div>
                  </div>
                </div>
              </div>
            </>
          )}
          {settingsTab === 'users' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">{newUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <UserForm newUser={newUser} setNewUser={setNewUser} onSubmit={handleUserSubmit} onCancel={() => setNewUser({ id: null, username: '', password: '', full_name: '', role: 'operator' })} inputTheme={inputTheme} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Usuários Cadastrados</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {users.map(u => (
                    <div key={u.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${!u.is_active ? 'border-gray-400 opacity-60' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{u.full_name}</div>
                        <div className="text-[9px] text-muted uppercase">@{u.username} • {u.role}</div>
                        <div className="text-[8px] text-muted">Criado em: {new Date(u.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setNewUser({ id: u.id, username: u.username, password: '', full_name: u.full_name, role: u.role })} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`${u.is_active ? 'Desativar' : 'Ativar'} usuário ${u.full_name}?`) && ipc) { ipc.invoke('users:toggle-active', u.id).then(() => loadUsers()); } }} className={`p-2 rounded-lg transition-colors ${u.is_active ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'}`}>{u.is_active ? <X size={16} /> : <Check size={16} />}</button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Excluir usuário ${u.full_name}?`) && ipc) { ipc.invoke('users:delete', u.id).then(() => loadUsers()); } }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {settingsTab === 'inventory' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">{selectedInventoryItem ? 'Editar Estoque' : 'Adicionar ao Estoque'}</h3>
                <InventoryForm inventoryForm={inventoryForm} setInventoryForm={setInventoryForm} products={safeCatalog} onSubmit={handleInventorySubmit} inputTheme={inputTheme} />
                {selectedInventoryItem && (
                  <div className="mt-6">
                    <h4 className="text-[9px] font-bold text-muted uppercase mb-2">Movimentações</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {inventoryMovements.map((m, i) => (
                        <div key={i} className="text-[8px] text-muted bg-surface-light p-2 rounded border border-border">
                          {m.type === 'in' ? '+' : '-'}{m.quantity} {m.unit} - {m.reason || 'Ajuste'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Estoque Atual</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {inventory.map(inv => (
                    <div key={inv.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${inv.quantity <= inv.min_quantity ? 'border-orange-500 bg-orange-50' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{inv.product_name}</div>
                        <div className="text-[9px] text-muted uppercase">{inv.category} • {inv.quantity} {inv.unit}</div>
                        {inv.quantity <= inv.min_quantity && <div className="text-[8px] text-orange-500 font-bold uppercase mt-1">⚠️ Estoque Baixo</div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedInventoryItem(inv); loadInventoryMovements(inv.id); }} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors" title="Ver Histórico"><FileText size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Ajustar estoque de ${inv.product_name}?`) && ipc) { const delta = prompt('Quantidade a adicionar (positivo) ou remover (negativo):', '0'); if (delta) { ipc.invoke('inventory:adjust', { inventoryId: inv.id, delta: parseFloat(delta), reason: 'Ajuste manual' }).then(() => loadInventory()); } } }} className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg transition-colors" title="Ajustar Estoque"><ArrowUpCircle size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {settingsTab === 'financial' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">{financialForm.id ? 'Editar Conta' : 'Nova Conta'}</h3>
                <FinancialForm financialForm={financialForm} setFinancialForm={setFinancialForm} onSubmit={handleFinancialSubmit} onCancel={() => setFinancialForm({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' })} inputTheme={inputTheme} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-4 mb-4 border-b border-border pb-4">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Contas Financeiras</h3>
                  <div className="flex gap-2">
                    <select value={financialFilter.type} onChange={e => setFinancialFilter({...financialFilter, type: e.target.value})} className="text-[9px] border border-border rounded px-2 py-1">
                      <option value="all">Todos Tipos</option>
                      <option value="payable">A Pagar</option>
                      <option value="receivable">A Receber</option>
                    </select>
                    <select value={financialFilter.status} onChange={e => setFinancialFilter({...financialFilter, status: e.target.value})} className="text-[9px] border border-border rounded px-2 py-1">
                      <option value="all">Todos Status</option>
                      <option value="pending">Pendente</option>
                      <option value="paid">Pago</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                    <button onClick={loadFinancialAccounts} className="text-[9px] bg-surface-light hover:bg-border px-2 py-1 rounded font-bold">Filtrar</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {financialAccounts.map(acc => (
                    <div key={acc.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${acc.status === 'paid' ? 'border-emerald-500 bg-emerald-50' : acc.status === 'cancelled' ? 'border-gray-400 opacity-60' : acc.due_date && new Date(acc.due_date) < new Date() ? 'border-red-500 bg-red-50' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{acc.description}</div>
                        <div className="text-[9px] text-muted uppercase">{acc.type === 'payable' ? 'A Pagar' : 'A Receber'} • R$ {acc.amount.toFixed(2)}</div>
                        <div className="text-[8px] text-muted">Vencimento: {acc.due_date ? new Date(acc.due_date).toLocaleDateString() : 'N/A'} • {acc.status}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setFinancialForm({ id: acc.id, type: acc.type, description: acc.description, amount: acc.amount.toString(), due_date: acc.due_date || '', status: acc.status, category: acc.category || '' })} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Excluir conta ${acc.description}?`) && ipc) { ipc.invoke('financial:delete-account', acc.id).then(() => loadFinancialAccounts()); } }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {settingsTab === 'clients' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase mb-4 tracking-widest border-b border-border pb-2">{clientForm.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <ClientForm clientForm={clientForm} setClientForm={setClientForm} onSubmit={handleClientSubmit} onCancel={() => setClientForm({ id: null, name: '', phone: '', address: '', email: '', notes: '' })} inputTheme={inputTheme} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Clientes Cadastrados</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {clients.map(client => (
                    <div key={client.id} className="flex items-center justify-between bg-surface-light border border-border p-3 rounded-lg">
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{client.name}</div>
                        <div className="text-[9px] text-muted uppercase">{client.phone || 'Sem telefone'} • {client.email || 'Sem email'}</div>
                        <div className="text-[8px] text-muted">Cadastrado em: {new Date(client.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setClientForm({ id: client.id, name: client.name, phone: client.phone || '', address: client.address || '', email: client.email || '', notes: client.notes || '' }); loadClientOrders(client.id); }} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Excluir cliente ${client.name}?`) && ipc) { ipc.invoke('clients:delete', client.id).then(() => loadClients()); } }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedClientOrders.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <h4 className="text-[9px] font-bold text-muted uppercase mb-2">Histórico de Pedidos</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                      {selectedClientOrders.map(order => (
                        <div key={order.id} className="text-[8px] text-muted bg-surface-light p-2 rounded">
                          {new Date(order.created_at).toLocaleDateString()} - R$ {order.total_amount.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
