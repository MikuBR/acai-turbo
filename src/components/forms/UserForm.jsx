import React from 'react';

export default function UserForm({ newUser, setNewUser, onSubmit, onCancel, inputTheme }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 select-text">
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nome Completo</label>
        <input type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Usuário</label>
        <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className={inputTheme} required />
      </div>
      <div>
        <label className="text-[9px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Senha</label>
        <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={inputTheme} required />
      </div>
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
        <button type="button" onClick={onCancel} className="w-full py-2 text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors">Cancelar Edição</button>
      )}
    </form>
  );
}
