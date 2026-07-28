import { Pencil, Trash2, X, Check, FileText, ArrowUpCircle, Save } from 'lucide-react';
import SettingsTabs from '../molecules/SettingsTabs';
import ProductForm from '../forms/ProductForm';
import PromotionForm from '../forms/PromotionForm';
import UserForm from '../forms/UserForm';
import InventoryForm from '../forms/InventoryForm';
import FinancialForm from '../forms/FinancialForm';
import ClientForm from '../forms/ClientForm';
import CategoryForm from '../forms/CategoryForm';


export default function SettingsModal({ isOpen, onClose, settingsTab, setSettingsTab, safeCatalog, categories, newCatName, setNewCatName, newProd, setNewProd, newPromo, setNewPromo, users, newUser, setNewUser, inventory, inventoryForm, setInventoryForm, selectedInventoryItem, setSelectedInventoryItem, inventoryMovements, loadInventoryMovements, financialAccounts, financialForm, setFinancialForm, financialFilter, setFinancialFilter, clients, clientForm, setClientForm, selectedClientOrders, promotions, pwdForm, setPwdForm, syncDB, loadUsers, loadInventory, loadFinancialAccounts, loadClients, loadClientOrders, runWithAuth, getIPC, printerConfig, setPrinterConfig, savePrinterConfig, currentUser }) {
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
          <button onClick={onClose} className="p-1.5 hover:bg-danger/20 rounded-md text-muted hover:text-danger transition-all"><X size={20}/></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {settingsTab === 'products' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <CategoryForm newCatName={newCatName} setNewCatName={setNewCatName} categories={categories} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />
                <h3 className="text-[10px] font-bold text-muted uppercase mb-6 tracking-widest border-b border-border pb-2">{newProd.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <ProductForm newProd={newProd} setNewProd={setNewProd} categories={categories} onSubmit={handleProductSubmit} onCancel={() => setNewProd({ id: null, name: '', price: '', category: '', ingredients: '' })} />
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
                        <button onClick={() => runWithAuth(() => setNewProd({ id: p.id, name: p.name, price: p.price.toString(), category: p.category, ingredients: p.ingredients || '' }), 'edit_products')} className="p-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => runWithAuth(() => { const ipc = getIPC(); if(window.confirm(`Excluir ${p.name}?`) && ipc) { ipc.invoke('catalog:delete-product', p.id).then(() => syncDB()); } }, 'delete_products')} className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">{newPromo.id ? 'Editar Promoção' : 'Nova Promoção'}</h3>
                <PromotionForm newPromo={newPromo} setNewPromo={setNewPromo} categories={categories} onSubmit={handlePromoSubmit} onCancel={() => setNewPromo({ id: null, name: '', type: 'PERCENTAGE', value: '', applies_to: 'ALL', target_category: '', target_product_id: '', min_quantity: '1', start_date: '', end_date: '', is_active: true })} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Promoções Cadastradas</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {promotions.map(p => (
                    <div key={p.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${!p.is_active ? 'border-border opacity-60' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{p.name}</div>
                        <div className="text-[9px] text-muted uppercase">{p.type} - {p.applies_to} {p.value}{p.type === 'PERCENTAGE' ? '%' : 'R$'}</div>
                        <div className="text-[8px] text-muted">{new Date(p.start_date).toLocaleDateString()} até {new Date(p.end_date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => runWithAuth(() => setNewPromo({ id: p.id, name: p.name, type: p.type, value: p.value.toString(), applies_to: p.applies_to, target_category: p.target_category || '', target_product_id: p.target_product_id || '', min_quantity: p.min_quantity.toString(), start_date: p.start_date, end_date: p.end_date, is_active: p.is_active }), 'edit_promotions')} className="p-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => runWithAuth(() => { const ipc = getIPC(); if(window.confirm(`Excluir promoção ${p.name}?`) && ipc) { ipc.invoke('promotions:delete', p.id).then(() => syncDB()); } }, 'delete_promotions')} className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">Alterar Senha</h3>
                <div className="space-y-3">
                  <input type="password" placeholder="Senha Atual" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                  <input type="password" placeholder="Nova Senha" value={pwdForm.next} onChange={e => setPwdForm({...pwdForm, next: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                  <button onClick={handlePasswordChange} className="w-full bg-success hover:bg-success py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all">Alterar Senha</button>
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
                  {currentUser?.role === 'admin' && (
                    <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg space-y-3">
                      <div className="font-bold text-xs uppercase text-warning mb-1">Recuperação de Senhas</div>
                      <div className="text-[10px] text-muted">Administradores podem resetar senhas para evitar bloqueio do sistema.</div>
                      <button onClick={() => { const ipc = getIPC(); if(ipc && window.confirm('Resetar a senha do gerente? Uma nova senha temporária será gerada.')) { ipc.invoke('auth:reset-manager-password').then(res => { if(res.success) alert(`Senha do gerente resetada!\nNova senha temporária: ${res.tempPassword}\n\nGuarde esta senha em local seguro.`); else alert('Erro: ' + res.error); }); } }} className="w-full bg-warning hover:bg-warning py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest text-white transition-all">Resetar Senha do Gerente</button>
                      <button onClick={() => { if(!users || users.length === 0) { alert('Nenhum usuário encontrado'); return; } const adminUser = window.prompt('ID do administrador para resetar senha:'); if(adminUser) { const newPwd = window.prompt('Nova senha (mínimo 8 caracteres):'); if(newPwd && newPwd.length >= 8) { const ipc = getIPC(); if(ipc) ipc.invoke('auth:force-reset-admin', { adminId: parseInt(adminUser), newPassword: newPwd }).then(res => { if(res.success) alert('Senha do administrador alterada com sucesso! O usuário deverá trocar a senha no próximo login.'); else alert('Erro: ' + res.error); }); } else { alert('A senha deve ter no mínimo 8 caracteres.'); } } }} className="w-full bg-info hover:bg-info py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest text-white transition-all">Resetar Senha de Admin</button>
                    </div>
                  )}
                  <div className="bg-success/10 border border-success/30 p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase text-success mb-2">Redundância de Segurança</div>
                    <div className="text-[10px] text-muted">Administradores podem recuperar a senha do gerente. Gerentes podem solicitar a administradores que recuperem suas senhas. O último administrador nunca pode ser deletado ou desativado.</div>
                  </div>
                </div>
              </div>
            </>
          )}
          {settingsTab === 'users' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">{newUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <UserForm newUser={newUser} setNewUser={setNewUser} onSubmit={handleUserSubmit} onCancel={() => setNewUser({ id: null, username: '', password: '', full_name: '', role: 'operator' })} />
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Usuários Cadastrados</h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {users.map(u => (
                    <div key={u.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${!u.is_active ? 'border-border opacity-60' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{u.full_name}</div>
                        <div className="text-[9px] text-muted uppercase">@{u.username} • {u.role}</div>
                        <div className="text-[8px] text-muted">Criado em: {new Date(u.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setNewUser({ id: u.id, username: u.username, password: '', full_name: u.full_name, role: u.role })} className="p-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`${u.is_active ? 'Desativar' : 'Ativar'} usuário ${u.full_name}?`) && ipc) { ipc.invoke('users:toggle-active', u.id).then(() => loadUsers()); } }} className={`p-2 rounded-lg transition-colors ${u.is_active ? 'bg-warning/10 hover:bg-warning/20 text-warning' : 'bg-success/10 hover:bg-success/20 text-success'}`}>{u.is_active ? <X size={16} /> : <Check size={16} />}</button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Excluir usuário ${u.full_name}?`) && ipc) { ipc.invoke('users:delete', u.id).then(() => loadUsers()); } }} className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">{selectedInventoryItem ? 'Editar Estoque' : 'Adicionar ao Estoque'}</h3>
                <InventoryForm inventoryForm={inventoryForm} setInventoryForm={setInventoryForm} products={safeCatalog} onSubmit={handleInventorySubmit} />
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
                    <div key={inv.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${inv.quantity <= inv.min_quantity ? 'border-warning bg-warning/10' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{inv.product_name}</div>
                        <div className="text-[9px] text-muted uppercase">{inv.category} • {inv.quantity} {inv.unit}</div>
                        {inv.quantity <= inv.min_quantity && <div className="text-[8px] text-warning font-bold uppercase mt-1">⚠️ Estoque Baixo</div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedInventoryItem(inv); loadInventoryMovements(inv.id); }} className="p-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors" title="Ver Histórico"><FileText size={16} /></button>
                        <button onClick={() => {
                          const ipc = getIPC();
                          if(ipc && window.confirm(`Ajustar estoque de ${inv.product_name}?`)) {
                            const deltaInput = document.createElement('input');
                            deltaInput.type = 'number';
                            deltaInput.placeholder = 'Quantidade a adicionar (positivo) ou remover (negativo)';
                            deltaInput.value = '0';
                            deltaInput.className = 'bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm w-full';
                            
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-surface z-[901] flex items-center justify-center p-6';
                            modal.innerHTML = `
                              <div class="bg-card w-full max-w-xs rounded-2xl border border-border p-6 shadow-2xl">
                                <h3 class="text-xs font-bold uppercase text-muted mb-4">Ajustar Estoque</h3>
                                <div class="space-y-4">
                                  <div>
                                    <label class="text-[10px] text-muted font-bold uppercase block mb-1">Quantidade</label>
                                    ${deltaInput.outerHTML}
                                  </div>
                                  <div class="flex gap-2">
                                    <button onclick="this.closest('.fixed').style.display='none'" class="flex-1 bg-surface-light hover:bg-border py-2 rounded-lg font-bold text-[10px] uppercase">Cancelar</button>
                                    <button id="confirmBtn" class="flex-1 bg-warning hover:bg-warning py-2 rounded-lg font-bold text-[10px] uppercase text-white">Confirmar</button>
                                  </div>
                                </div>
                              </div>
                            `;
                            
                            document.body.appendChild(modal);
                            
                            const confirmBtn = modal.querySelector('#confirmBtn');
                            confirmBtn.onclick = () => {
                              const inputEl = modal.querySelector('input');
                              const delta = parseFloat(inputEl ? inputEl.value : '0');
                              if(!isNaN(delta)) {
                                ipc.invoke('inventory:adjust', { inventoryId: inv.id, delta: delta, reason: 'Ajuste manual' })
                                  .then(() => {
                                    loadInventory();
                                    document.body.removeChild(modal);
                                  })
                                  .catch(err => console.error(err));
                              }
                            };
                          }
                        }} className="p-2 bg-warning/10 hover:bg-warning/20 text-warning rounded-lg transition-colors" title="Ajustar Estoque"><ArrowUpCircle size={16} /></button>
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
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">{financialForm.id ? 'Editar Conta' : 'Nova Conta'}</h3>
                <FinancialForm financialForm={financialForm} setFinancialForm={setFinancialForm} onSubmit={handleFinancialSubmit} onCancel={() => setFinancialForm({ id: null, type: 'payable', description: '', amount: '', due_date: '', status: 'pending', category: '' })} />
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
                    <div key={acc.id} className={`flex items-center justify-between bg-surface-light border p-3 rounded-lg ${acc.status === 'paid' ? 'border-success bg-success/10' : acc.status === 'cancelled' ? 'border-border opacity-60' : acc.due_date && new Date(acc.due_date) < new Date() ? 'border-danger bg-danger/10' : 'border-border'}`}>
                      <div>
                        <div className="font-bold text-xs uppercase text-primary">{acc.description}</div>
                        <div className="text-[9px] text-muted uppercase">{acc.type === 'payable' ? 'A Pagar' : 'A Receber'} • R$ {acc.amount.toFixed(2)}</div>
                        <div className="text-[8px] text-muted">Vencimento: {acc.due_date ? new Date(acc.due_date).toLocaleDateString() : 'N/A'} • {acc.status}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setFinancialForm({ id: acc.id, type: acc.type, description: acc.description, amount: acc.amount.toString(), due_date: acc.due_date || '', status: acc.status, category: acc.category || '' })} className="p-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Excluir conta ${acc.description}?`) && ipc) { ipc.invoke('financial:delete-account', acc.id).then(() => loadFinancialAccounts()); } }} className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">{clientForm.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <ClientForm clientForm={clientForm} setClientForm={setClientForm} onSubmit={handleClientSubmit} onCancel={() => setClientForm({ id: null, name: '', phone: '', address: '', email: '', notes: '' })} />
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
                        <button onClick={() => { setClientForm({ id: client.id, name: client.name, phone: client.phone || '', address: client.address || '', email: client.email || '', notes: client.notes || '' }); loadClientOrders(client.id); }} className="p-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => { const ipc = getIPC(); if(window.confirm(`Excluir cliente ${client.name}?`) && ipc) { ipc.invoke('clients:delete', client.id).then(() => loadClients()); } }} className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"><Trash2 size={16} /></button>
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
          {settingsTab === 'printers' && (
            <>
              <div className="w-80 p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-bold text-success uppercase mb-4 tracking-widest border-b border-border pb-2">Configurar Impressoras</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Impressora da Cozinha (IP)</label>
                    <input type="text" placeholder="192.168.1.100" value={printerConfig.kitchenIp} onChange={e => setPrinterConfig({...printerConfig, kitchenIp: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Impressora do Balcão (Nome)</label>
                    <input type="text" placeholder="TANCA" value={printerConfig.frontName} onChange={e => setPrinterConfig({...printerConfig, frontName: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                  </div>
                  <button onClick={() => savePrinterConfig()} className="w-full bg-success hover:bg-success py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"><Save size={16} /> Salvar Configurações</button>
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest border-b border-border pb-2">Informações</h3>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                  <div className="bg-surface-light border border-border p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase text-primary mb-2">Impressora da Cozinha</div>
                    <div className="text-[10px] text-muted">Utiliza conexão TCP/IP direta. Configure o IP da impressora térmica da cozinha.</div>
                    <div className="text-[9px] text-muted mt-2">Formato: 192.168.1.100 (apenas o IP, sem protocolo)</div>
                  </div>
                  <div className="bg-surface-light border border-border p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase text-primary mb-2">Impressora do Balcão</div>
                    <div className="text-[10px] text-muted">Nome da impressora instalada no Windows para impressão de bebidas e abertura de gaveta.</div>
                    <div className="text-[9px] text-muted mt-2">Formato: Nome exato da impressora no sistema</div>
                  </div>
                  <div className="bg-info/10 border border-info/30 p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase text-info mb-2">Dica</div>
                    <div className="text-[10px] text-muted">As alterações são aplicadas imediatamente após salvar. Não é necessário reiniciar o sistema.</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
