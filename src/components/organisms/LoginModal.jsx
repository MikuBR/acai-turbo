import { Lock } from 'lucide-react';

export default function LoginModal({
  isOpen,
  loginForm = { username: '', password: '' },
  setLoginForm = () => {},
  loginError,
  error,
  handleLogin,
  onLogin,
}) {
  if (!isOpen) return null;

  const activeForm = loginForm || { username: '', password: '' };
  const activeError = loginError || error;
  const activeSubmit = handleLogin || onLogin || ((e) => e.preventDefault());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card p-8 rounded-2xl border border-border w-96 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <Lock size={40} className="text-primary"/>
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
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
              placeholder="Digite seu usuário"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Senha</label>
            <input
              type="password"
              value={activeForm.password || ''}
              onChange={e => setLoginForm({...activeForm, password: e.target.value})}
              className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm"
              placeholder="Digite sua senha"
            />
          </div>

          {activeError && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs font-bold text-center">
              {activeError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-primary/40"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-muted">
            Usuário padrão: <span className="font-bold text-primary">admin</span>
            <br />
            Senha padrão: <span className="font-bold text-primary">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}