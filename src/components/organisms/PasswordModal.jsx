import React from 'react';
import { Lock } from 'lucide-react';

export default function PasswordModal({ isOpen, onClose, changePasswordForm, setChangePasswordForm, handleChangePassword }) {
  if (!isOpen) return null;

  const inputTheme = "w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all";

  return (
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
            <input type="password" value={changePasswordForm.current} onChange={e => setChangePasswordForm({...changePasswordForm, current: e.target.value})}
              className={inputTheme} placeholder="Digite sua senha atual" autoFocus />
          </div>
          <div>
            <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Nova Senha</label>
            <input type="password" value={changePasswordForm.new} onChange={e => setChangePasswordForm({...changePasswordForm, new: e.target.value})}
              className={inputTheme} placeholder="Digite sua nova senha" />
          </div>
          <div>
            <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">Confirmar Nova Senha</label>
            <input type="password" value={changePasswordForm.confirm} onChange={e => setChangePasswordForm({...changePasswordForm, confirm: e.target.value})}
              className={inputTheme} placeholder="Confirme sua nova senha" />
          </div>

          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-95">
            Alterar Senha
          </button>
        </form>
      </div>
    </div>
  );
}
