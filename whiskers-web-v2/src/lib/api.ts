import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type CreateOrderLine = { flavourId: string; quantity: number }

export type CreateOrderResponse = {
  id: string
  status: string
  totalCents: number
  items: {
    flavourId: string
    name: string
    quantity: number
    unitPriceCents: number
  }[]
}

export async function createOrder(payload: {
  items: CreateOrderLine[]
  guestEmail?: string
  guestPhone?: string
}) {
  const { data } = await api.post<CreateOrderResponse>('/orders', payload)
  return data
}

export async function createPaymentLink(orderId: string) {
  const { data } = await api.post<{ checkoutUrl: string; squareOrderId: string }>(
    `/orders/${orderId}/pay`,
  )
  return data
}

export type PublicOrder = {
  id: string
  status: string
  totalCents: number
  createdAt: string
  items: {
    quantity: number
    unitPriceCents: number
    flavour: { name: string }
  }[]
}

export async function getOrder(orderId: string) {
  const { data } = await api.get<PublicOrder>(`/orders/${orderId}`)
  return data
}
