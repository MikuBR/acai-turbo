import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginModal({
  isOpen,
  loginForm = { username: '', password: '' },
  setLoginForm = () => {},
  loginError,
  error,
  handleLogin,
  onLogin,
  submitting = false,
}) {
  const [showPwd, setShowPwd] = useState(false);
  if (!isOpen) return null;

  const activeForm = loginForm || { username: '', password: '' };
  const activeError = loginError || error;
  const activeSubmit = handleLogin || onLogin || ((e) => e.preventDefault());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card p-8 rounded-2xl border border-border w-96 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Lock size={36} className="text-white"/>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-1">Açaí Wave</h2>
          <p className="text-muted text-sm">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={activeSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Usuário</label>
            <input
              type="text"
              value={activeForm.username || ''}
              onChange={e => setLoginForm({...activeForm, username: e.target.value})}
              disabled={submitting}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Digite seu usuário"
              autoFocus
            />
            {activeError === 'Preencha todos os campos' && !activeForm.username && <span className="text-[9px] text-danger font-bold mt-1 block">Campo obrigatório</span>}
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Senha</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={activeForm.password || ''}
                onChange={e => setLoginForm({...activeForm, password: e.target.value})}
                disabled={submitting}
                className="w-full bg-card border border-border p-3 pr-10 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {activeError === 'Preencha todos os campos' && !activeForm.password && <span className="text-[9px] text-danger font-bold mt-1 block">Campo obrigatório</span>}
          </div>

          {activeError && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs font-bold text-center animate-shake">
              {activeError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-primary/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}