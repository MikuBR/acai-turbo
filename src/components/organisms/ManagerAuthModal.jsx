import React, { useRef } from 'react';
import { Lock } from 'lucide-react';

export default function ManagerAuthModal({ show, onCancel, ipcGet }) {
  const inputRef = useRef(null);

  if (!show) return null;

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      const ipc = ipcGet();
      if (ipc) {
        const res = await ipc.invoke('auth:verify-password', e.target.value);
        if (res.valid) {
          if (window.__authCallback) window.__authCallback();
          onCancel();
        } else {
          alert("Senha Incorreta");
          e.target.value = "";
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/98 z-[1000] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl border border-gray-300 w-80 shadow-2xl text-center">
        <div className="w-16 h-16 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <Lock size={32} className="text-emerald-500"/>
        </div>
        <h3 className="text-gray-900 font-bold mb-1 uppercase tracking-widest text-xs">Autorização</h3>
        <p className="text-gray-600 text-[10px] mb-6">Digite a senha de gerente para prosseguir</p>
        
        <input 
          type="password" 
          placeholder="****"
          className="w-full bg-gray-100 border border-gray-300 p-4 rounded-xl text-center text-2xl tracking-[1em] text-gray-900 outline-none focus:border-emerald-500 mb-6"
          autoFocus
          ref={inputRef}
          onKeyDown={handleKeyDown}
        />
        <button onClick={onCancel} className="text-[10px] font-bold text-gray-600 uppercase hover:text-gray-900 transition-colors">Cancelar</button>
      </div>
    </div>
  );
}
