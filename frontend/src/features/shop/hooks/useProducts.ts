import { useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchProducts } from '../api/shopApi';

export function useProducts() {
  return useQuery({
    queryKey: ['shop-products'],
    queryFn: fetchProducts,
    staleTime: 30_000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['shop-product', id],
    queryFn: () => fetchProduct(id as string),
    enabled: Boolean(id),
  });
}
