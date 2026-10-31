import { create } from 'zustand';
import { mark, measure } from '../services/performance';

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  must_change_password: number;
  must_change_manager_password: number;
}

interface AuthStore {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  authTime: number;
  login: (user: AuthUser) => void;
  logout: () => void;
  setAuthTime: (ts: number) => void;
  isAuthValid: () => boolean;
  checkAuth: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

const MANAGER_AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Helper para acessar o IPC do Electron
function getIPC() {
  if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
    return (window as any).electron.ipcRenderer;
  }
  return null;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authTime: 0,
  login: (user) => {
    // Token NÃO é mais armazenado em localStorage — fica em cookie httpOnly
    set({ currentUser: user, isAuthenticated: true, authTime: Date.now() });
  },
  logout: () => {
    mark('auth:logout:start');
    const ipc = getIPC();
    const user = get().currentUser;
    if (ipc && user) {
      // Await so callers (and tests) can reliably chain; the catch prevents
      // unhandled rejections if the IPC channel fails.
      Promise.resolve(ipc.invoke('auth:logout', { userId: user.id })).catch(() => {});
    }
    set({ currentUser: null, isAuthenticated: false, authTime: 0 });
    mark('auth:logout:end');
    measure('auth:logout:start', 'auth:logout:end');
  },
  setAuthTime: (ts) => set({ authTime: ts }),
  isAuthValid: () => Date.now() < get().authTime + MANAGER_AUTH_WINDOW_MS,
  checkAuth: async () => {
    mark('auth:check:start');
    const ipc = getIPC();
    if (!ipc) { mark('auth:check:end'); return false; }
    try {
      const res = await ipc.invoke('auth:check');
      if (res?.success && res.authenticated) {
        set({ currentUser: res.user, isAuthenticated: true, authTime: Date.now() });
        mark('auth:check:end');
        measure('auth:check:start', 'auth:check:end');
        return true;
      }
      mark('auth:check:end');
      measure('auth:check:start', 'auth:check:end');
      return false;
    } catch {
      mark('auth:check:end');
      measure('auth:check:start', 'auth:check:end');
      return false;
    }
  },
  refreshToken: async () => {
    mark('auth:refresh:start');
    const ipc = getIPC();
    if (!ipc) { mark('auth:refresh:end'); return false; }
    try {
      const res = await ipc.invoke('auth:refresh');
      if (res?.success) {
        set({ currentUser: res.user, isAuthenticated: true, authTime: Date.now() });
        mark('auth:refresh:end');
        measure('auth:refresh:start', 'auth:refresh:end');
        return true;
      }
      mark('auth:refresh:end');
      measure('auth:refresh:start', 'auth:refresh:end');
      return false;
    } catch {
      mark('auth:refresh:end');
      measure('auth:refresh:start', 'auth:refresh:end');
      return false;
    }
  },
}));
