import { useRef } from 'react';
import { Lock } from 'lucide-react';
import useToastStore from '../../store/toastStore';

export default function ManagerAuthModal({ show, onCancel, onSuccess, ipcGet }) {
  const addToast = useToastStore(s => s.addToast);
  const inputRef = useRef(null);

  if (!show) return null;

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      const ipc = ipcGet();
      if (ipc) {
        const res = await ipc.invoke('auth:verify-password', e.target.value);
        if (res.valid) {
          if (onSuccess) onSuccess();
          onCancel();
        } else {
          addToast('Senha incorreta', 'error');
          e.target.value = "";
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-surface z-[1000] flex items-center justify-center">
      <div className="bg-card p-8 rounded-2xl border border-border w-80 shadow-2xl text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
          <Lock size={32} className="text-success"/>
        </div>
        <h3 className="text-primary font-bold mb-1 uppercase tracking-widest text-xs">Autorização</h3>
        <p className="text-muted text-[10px] mb-6">Digite a senha de gerente para prosseguir</p>
        
        <input 
          type="password" 
          placeholder="****"
          className="w-full bg-surface-light border border-border p-4 rounded-xl text-center text-2xl tracking-[1em] text-primary outline-none focus:border-primary mb-6"
          autoFocus
          ref={inputRef}
          onKeyDown={handleKeyDown}
        />
        <button onClick={onCancel} className="text-[10px] font-bold text-muted uppercase hover:text-primary transition-colors">Cancelar</button>
      </div>
    </div>
  );
}
