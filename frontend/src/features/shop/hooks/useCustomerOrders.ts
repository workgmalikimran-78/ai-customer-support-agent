import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyOrders, placeOrder } from '../api/shopApi';
import type { CustomerOrder, PlaceOrderInput } from '../types/shop';

export function useCustomerOrders() {
  return useQuery({
    queryKey: ['shop-my-orders'],
    queryFn: fetchMyOrders,
    staleTime: 15_000,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceOrderInput) => placeOrder(input),
    onSuccess: (order) => {
      queryClient.setQueryData<CustomerOrder[] | undefined>(['shop-my-orders'], (prev) =>
        prev ? [order, ...prev] : [order],
      );
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
    },
  });
}
