import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import LoginModal from '../../components/organisms/LoginModal.jsx';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const authLog = logger.withScope('auth');

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.username || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      return;
    }

    const ipc = getIPC();
    if (ipc) {
      setIsLoggingIn(true);
      try {
        const res = await ipc.invoke('auth:login', loginForm);
        if (res.success) {
          storeLogin(res.user, res.token);
          localStorage.setItem('authToken', res.token);
          authLog.info('user logged in', { username: loginForm.username });

          if (res.user.must_change_password) {
            navigate('/change-password');
          } else {
            navigate('/pdv');
          }

          setLoginForm({ username: '', password: '' });
        } else {
          setLoginError(res.error || 'Erro ao fazer login.');
        }
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-surface">
      <LoginModal
        isOpen={true}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        handleLogin={handleLogin}
        submitting={isLoggingIn}
      />
    </div>
  );
}
