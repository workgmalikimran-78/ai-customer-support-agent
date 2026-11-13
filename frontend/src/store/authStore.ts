import { create } from 'zustand';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  teamId: string;
}

interface AuthState {
  user: AuthUser;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const TOKEN_KEY = 'smartify_token';
const USER_KEY = 'smartify_user';

const EMPTY_USER: AuthUser = { id: '', name: '', email: '', role: '', teamId: '' };

function loadPersistedUser(): AuthUser | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

const persistedUser = loadPersistedUser();

/**
 * Real auth state, hydrated from localStorage on load so a page refresh doesn't force
 * a re-login. `setUser` is called by the login page after a successful
 * POST /api/auth/login; `httpClient`'s request interceptor reads the token directly
 * from localStorage, so it only needs to be written here, not threaded through state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: persistedUser ?? EMPTY_USER,
  isAuthenticated: persistedUser !== null,
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: EMPTY_USER, isAuthenticated: false });
  },
}));
