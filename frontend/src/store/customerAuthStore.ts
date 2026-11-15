import { create } from 'zustand';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
}

interface CustomerAuthState {
  customer: CustomerUser;
  isAuthenticated: boolean;
  setCustomer: (customer: CustomerUser) => void;
  logout: () => void;
}

const TOKEN_KEY = 'smartify_customer_token';
const CUSTOMER_KEY = 'smartify_customer_user';

const EMPTY_CUSTOMER: CustomerUser = { id: '', name: '', email: '' };

function loadPersistedCustomer(): CustomerUser | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(CUSTOMER_KEY);
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw) as CustomerUser;
  } catch {
    return null;
  }
}

const persistedCustomer = loadPersistedCustomer();

/**
 * Customer (shop) auth state -- deliberately a separate store from `authStore.ts` (the
 * agent/admin dashboard's auth), with its own localStorage keys, so a customer logged into
 * /shop and an agent logged into the dashboard in the same browser never collide.
 */
export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  customer: persistedCustomer ?? EMPTY_CUSTOMER,
  isAuthenticated: persistedCustomer !== null,
  setCustomer: (customer) => {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    set({ customer, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    set({ customer: EMPTY_CUSTOMER, isAuthenticated: false });
  },
}));
