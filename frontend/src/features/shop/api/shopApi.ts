import { shopHttpClient } from '@/api/httpClient';
import type { CustomerOrder, PlaceOrderInput, Product } from '../types/shop';

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await shopHttpClient.get<Product[]>('/api/shop/products');
  return data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await shopHttpClient.get<Product>(`/api/shop/products/${id}`);
  return data;
}

export async function placeOrder(input: PlaceOrderInput): Promise<CustomerOrder> {
  const { data } = await shopHttpClient.post<CustomerOrder>('/api/shop/orders', input);
  return data;
}

export async function fetchMyOrders(): Promise<CustomerOrder[]> {
  const { data } = await shopHttpClient.get<CustomerOrder[]>('/api/shop/orders');
  return data;
}
