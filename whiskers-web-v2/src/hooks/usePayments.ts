import { useMutation } from '@tanstack/react-query'
import {
  createOrder,
  createPaymentLink,
  type CreateOrderLine,
  type CreateOrderResponse,
  type PublicOrder,
} from '../lib/api'

export function useCreateOrder() {
  return useMutation<CreateOrderResponse, unknown, { items: CreateOrderLine[]; guestEmail?: string; guestPhone?: string }>({
    mutationFn: (payload) => createOrder(payload),
  })
}

export function usePayOrder(orderId?: string) {
  return useMutation<{
    checkoutUrl: string
    squareOrderId: string
  }, unknown, void>({
    mutationFn: () => createPaymentLink(orderId!),
  })
}

// Convenience: (create order -> create payment link)
export function useCheckoutGuest() {
  return useMutation<
    PublicOrder,
    unknown,
    { items: CreateOrderLine[]; guestEmail?: string; guestPhone?: string }
  >({
    mutationFn: async (payload) => {
      const order = await createOrder(payload)
      // Payment link is created in CheckoutPage after this mutation in the current MVP;
      // keeping this hook for future expansion.
      return order as unknown as PublicOrder
    },
  })
}

