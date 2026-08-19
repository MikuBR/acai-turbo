import { Lock } from 'lucide-react';

export default function PasswordModal({ isOpen, changePasswordForm, setChangePasswordForm, handleChangePassword }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card p-8 rounded-2xl border border-border w-96 shadow-modal">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-warning/30">
            <Lock size={40} className="text-warning"/>
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">Alterar Senha</h2>
          <p className="text-muted text-sm">Você deve alterar sua senha para continuar</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Senha Atual</label>
            <input type="password" value={changePasswordForm.current} onChange={e => setChangePasswordForm({...changePasswordForm, current: e.target.value})}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" placeholder="Digite sua senha atual" autoFocus />
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Nova Senha</label>
            <input type="password" value={changePasswordForm.new} onChange={e => setChangePasswordForm({...changePasswordForm, new: e.target.value})}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" placeholder="Digite sua nova senha" />
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Confirmar Nova Senha</label>
            <input type="password" value={changePasswordForm.confirm} onChange={e => setChangePasswordForm({...changePasswordForm, confirm: e.target.value})}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" placeholder="Confirme sua nova senha" />
          </div>

          <button type="submit" className="w-full bg-warning hover:bg-warning py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-95">
            Alterar Senha
          </button>
        </form>
      </div>
    </div>
  );
}
