import httpClient from '@/api/httpClient';
import type { AuthResponse, LoginCredentials } from '../types/auth';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>('/api/auth/login', credentials);
  return data;
}
