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
    <div className="fixed inset-0 bg-gray-900/98 z-[2000] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-2xl border border-gray-300 w-96 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Lock size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Acai Turbo PDV</h2>
          <p className="text-gray-600 text-sm">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">
              Usuário
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
              placeholder="Digite seu usuário"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-600 font-bold uppercase ml-1 mb-1 block">
              Senha
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-gray-900 outline-none focus:border-emerald-500 transition-all"
              placeholder="Digite sua senha"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-xs font-bold text-center">
              {error}
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
  );
}