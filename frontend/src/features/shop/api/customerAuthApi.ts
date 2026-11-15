import { shopHttpClient } from '@/api/httpClient';
import type { CustomerAuthResponse, CustomerLoginInput, CustomerRegisterInput } from '../types/shop';

export async function customerLogin(input: CustomerLoginInput): Promise<CustomerAuthResponse> {
  const { data } = await shopHttpClient.post<CustomerAuthResponse>('/api/shop/auth/login', input);
  return data;
}

export async function customerRegister(input: CustomerRegisterInput): Promise<CustomerAuthResponse> {
  const { data } = await shopHttpClient.post<CustomerAuthResponse>('/api/shop/auth/register', input);
  return data;
}
