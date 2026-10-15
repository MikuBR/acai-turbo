import { redirect } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { mark, measure } from '../services/performance';

export function requireAuth() {
  mark('auth:guard:start');
  const { isAuthenticated, currentUser } = useAuthStore.getState();
  if (!isAuthenticated || !currentUser) {
    mark('auth:guard:end');
    const duration = measure('auth:guard:start', 'auth:guard:end');
    if (duration !== null) {
      console.log('[auth] guard redirect duration:', duration, 'ms');
    }
    throw redirect('/login');
  }
  mark('auth:guard:end');
  const duration = measure('auth:guard:start', 'auth:guard:end');
  if (duration !== null) {
    console.log('[auth] guard success duration:', duration, 'ms');
  }
  return null;
}
