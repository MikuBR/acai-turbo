import { create } from 'zustand';

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  must_change_password: number;
}

interface AuthStore {
  currentUser: AuthUser | null;
  authToken: string | null;
  authTime: number;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setAuthTime: (ts: number) => void;
  isAuthValid: () => boolean;
}

const MANAGER_AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  authToken: null,
  authTime: 0,
  login: (user, token) => {
    localStorage.setItem('authToken', token);
    set({ currentUser: user, authToken: token, authTime: Date.now() });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    set({ currentUser: null, authToken: null, authTime: 0 });
  },
  setAuthTime: (ts) => set({ authTime: ts }),
  isAuthValid: () => Date.now() < get().authTime + MANAGER_AUTH_WINDOW_MS,
}));