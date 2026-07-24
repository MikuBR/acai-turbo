import React, { useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * LoginModal - Modal de autenticação
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade
 * @param {Function} props.onLogin - Callback com { username, password }
 * @param {string} props.error - Mensagem de erro
 */
export function LoginModal({ isOpen, onLogin, error }) {
  const [form, setForm] = useState({ username: '', password: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return;
    onLogin?.(form);
  };

  return (
    <div className="fixed inset-0 bg-surface z-[2000] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-card p-8 rounded-2xl border border-border w-96 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
            <Lock size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-1">Acai Turbo PDV</h2>
          <p className="text-muted text-sm">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">
              Usuário
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-surface-light border border-border p-3 rounded-lg text-primary outline-none focus:border-primary transition-all"
              placeholder="Digite seu usuário"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase ml-1 mb-1 block">
              Senha
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-surface-light border border-border p-3 rounded-lg text-primary outline-none focus:border-primary transition-all"
              placeholder="Digite sua senha"
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-success hover:bg-success py-3 rounded-lg font-bold text-sm uppercase tracking-widest text-white transition-all active:scale-95"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-muted">
            Usuário padrão: <span className="font-bold text-secondary">admin</span>
            <br />
            Senha padrão: <span className="font-bold text-secondary">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}