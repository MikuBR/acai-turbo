import React from 'react';
import { Lock } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, loginForm, setLoginForm, loginError, handleLogin, inputTheme }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface z-[2000] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-surface p-8 rounded-2xl border border-border w-96 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <Lock size={40} className="text-primary"/>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-1">Acai Turbo PDV</h2>
          <p className="text-muted text-sm">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Usuário</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              className={inputTheme}
              placeholder="Digite seu usuário"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">Senha</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              className={inputTheme}
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
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-surface transition-all active:scale-95 shadow-lg shadow-primary/40"
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