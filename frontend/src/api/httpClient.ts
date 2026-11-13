import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080';

/**
 * Shared axios instance for the whole app. Feature-level `api/*.ts` files
 * should import this instead of creating their own axios instance so that
 * auth headers / interceptors stay centralized in one place.
 */
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartify_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized place to log/report API errors before letting React Query's
    // isError/error state handle presentation per-hook.
    // eslint-disable-next-line no-console
    console.warn('[httpClient] request failed:', error?.message ?? error);

    const status = error?.response?.status;
    const isAuthEndpoint = (error?.config?.url ?? '').includes('/api/auth/');
    // A stale/invalid/expired JWT surfaces here as 401 or 403 on any protected endpoint.
    // Without this, pages silently render an empty state (e.g. "0 open conversations")
    // instead of explaining that the session needs to be re-established.
    if ((status === 401 || status === 403) && !isAuthEndpoint && window.location.pathname !== '/login') {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default httpClient;
