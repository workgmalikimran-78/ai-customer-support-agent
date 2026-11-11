import axios from 'axios';

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
    // Centralized place to log/report API errors. Swallow network errors
    // when the backend isn't up yet so individual hooks can fall back to
    // mock data instead of crashing the UI.
    // eslint-disable-next-line no-console
    console.warn('[httpClient] request failed:', error?.message ?? error);
    return Promise.reject(error);
  },
);

export default httpClient;
