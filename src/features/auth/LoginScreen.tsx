import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { getIPC } from '../../services/ipc.js'
import logger from '../../services/logger.js'
import LoginModal from '../../components/organisms/LoginModal.tsx'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'

interface LoginForm {
  username: string
  password: string
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const authLog = logger.withScope('auth');
  const { mark, measure } = usePerformanceMark();

  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.username || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      return;
    }

    mark('login:start');

    const ipc = getIPC();
    if (ipc) {
      setIsLoggingIn(true);
      try {
        const res = await ipc.invoke('auth:login', loginForm);
        if (res.success) {
          storeLogin(res.user);
          authLog.info('user logged in', { username: loginForm.username });

          mark('login:end');
          const duration = measure('login:start', 'login:end');
          if (duration !== null) {
            authLog.info('login duration', { durationMs: duration });
          }

          navigate('/pdv');
          setLoginForm({ username: '', password: '' });
        } else {
          mark('login:end');
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
