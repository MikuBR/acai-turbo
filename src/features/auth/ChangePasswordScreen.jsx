import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import PasswordModal from '../../components/organisms/PasswordModal.jsx';

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { currentUser } = useAuthStore();
  const authLog = logger.withScope('auth');

  const [changePasswordForm, setChangePasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!changePasswordForm.current || !changePasswordForm.new || !changePasswordForm.confirm) {
      addToast('Preencha todos os campos', 'warning');
      return;
    }

    if (changePasswordForm.new !== changePasswordForm.confirm) {
      addToast('A nova senha e a confirmação não coincidem', 'warning');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      const res = await ipc.invoke('auth:change-user-password', {
        userId: currentUser.id,
        current: changePasswordForm.current,
        new: changePasswordForm.new
      });

      if (res.success) {
        addToast('Senha alterada com sucesso!', 'success');
        authLog.info('password changed');
        setChangePasswordForm({ current: '', new: '', confirm: '' });
        navigate('/pdv');
      } else {
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
