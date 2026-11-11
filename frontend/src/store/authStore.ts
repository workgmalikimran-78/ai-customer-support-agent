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

const MOCK_USER: AuthUser = {
  id: 'user-1',
  name: 'Enterprise Admin',
  email: 'qbric_developer1@nisum.com',
  role: 'Admin',
  teamId: 'team-smartify-1',
};

/**
 * Minimal mock-logged-in-user store. Swap `setUser` calls in for a real
 * login flow once the Spring Boot auth endpoints exist.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USER,
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}));
