import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getAdminOrders,
  getMyOrders,
  updateAdminOrderStatus,
  type OrdersListResponse,
  type PublicOrder,
} from '../lib/api'

export function useOrders(query?: { page?: number; limit?: number }) {
  return useQuery<OrdersListResponse>({
    queryKey: ['orders', query],
    queryFn: () => getMyOrders(query),
  })
}

export function useAdminOrders(query?: { page?: number; limit?: number }) {
  return useQuery<OrdersListResponse>({
    queryKey: ['admin-orders', query],
    queryFn: () => getAdminOrders(query),
  })
}

export function useUpdateOrderStatus() {
  return useMutation<PublicOrder, unknown, { orderId: string; status: string }>(
    {
      mutationFn: ({ orderId, status }) =>
        updateAdminOrderStatus(orderId, { status }),
    },
  )
}

