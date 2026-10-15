import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import useToastStore from '../../store/toastStore'
import { getIPC } from '../../services/ipc.js'
import logger from '../../services/logger.js'
import PasswordModal from '../../components/organisms/PasswordModal.tsx'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'

interface ChangePasswordForm {
  current: string
  new: string
  confirm: string
}

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { currentUser } = useAuthStore();
  const authLog = logger.withScope('auth');
  const { mark, measure } = usePerformanceMark();

  const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordForm>({ current: '', new: '', confirm: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordForm.current || !changePasswordForm.new || !changePasswordForm.confirm) {
      addToast('Preencha todos os campos', 'warning');
      return;
    }

    if (changePasswordForm.new !== changePasswordForm.confirm) {
      addToast('A nova senha e a confirmação não coincidem', 'warning');
      return;
    }

    if (!currentUser) {
      addToast('Não autenticado. Faça login novamente.', 'error');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      mark('change-password:start');
      const res = await ipc.invoke('auth:change-user-password', {
        userId: currentUser.id,
        current: changePasswordForm.current,
        new: changePasswordForm.new
      });

      if (res.success) {
        mark('change-password:end');
        const duration = measure('change-password:start', 'change-password:end');
        if (duration !== null) {
          authLog.info('password change duration', { durationMs: duration });
        }
        addToast('Senha alterada com sucesso!', 'success');
        authLog.info('password changed');
        setChangePasswordForm({ current: '', new: '', confirm: '' });
        navigate('/pdv');
      } else {
        mark('change-password:end');
        addToast('Erro: ' + res.error, 'error');
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-surface">
      <PasswordModal
        isOpen={true}
        changePasswordForm={changePasswordForm}
        setChangePasswordForm={setChangePasswordForm}
        handleChangePassword={handleChangePassword}
      />
    </div>
  );
}
