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

export type AuthRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export type PublicUser = {
  id: string
  email: string
  role: AuthRole
  isActive: boolean
  createdAt: string
  profile: { phone: string | null; address: string | null } | null
}

export type LoginResponse = {
  user: PublicUser
  accessToken: string
  refreshToken: string
  expiresInSec: number
}

export async function login(payload: {
  email: string
  password: string
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function register(payload: {
  email: string
  password: string
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', payload)
  return data
}

export async function refresh(refreshToken: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/refresh', {
    refreshToken,
  })
  return data
}

export async function logout(refreshToken: string): Promise<{ ok: boolean }> {
  const { data } = await api.post<{ ok: boolean }>('/auth/logout', {
    refreshToken,
  })
  return data
}

export async function getMe(): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>('/auth/me')
  return data
}

export type FlavourCategory = { id: string; name: string; slug: string }

export type Flavour = {
  id: string
  name: string
  slug: string
  description: string | null
  priceCents: number
  isActive: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  categories: FlavourCategory[]
}

export type FlavoursListResponse = {
  data: Flavour[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export async function getFlavours(query?: {
  page?: number
  limit?: number
  categoryId?: string
  search?: string
}): Promise<FlavoursListResponse> {
  const { data } = await api.get<FlavoursListResponse>('/flavours', {
    params: query,
  })
  return data
}

export async function getFlavour(id: string): Promise<Flavour> {
  const { data } = await api.get<Flavour>(`/flavours/${id}`)
  return data
}

export type Category = { id: string; name: string; slug: string }

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories')
  return data
}

export async function getTodayMenu(): Promise<Flavour[]> {
  const { data } = await api.get<Flavour[]>('/flavours/today')
  return data
}

export type CreateFlavourInput = {
  name: string
  slug?: string
  description?: string
  priceCents: number
  imageUrl?: string
  categoryIds?: string[]
}

export type UpdateFlavourInput = Partial<CreateFlavourInput> & {
  isActive?: boolean
}

export async function createFlavour(
  dto: CreateFlavourInput,
): Promise<Flavour> {
  const { data } = await api.post<Flavour>('/flavours', dto)
  return data
}

export async function updateFlavour(
  id: string,
  dto: UpdateFlavourInput,
): Promise<Flavour> {
  const { data } = await api.patch<Flavour>(`/flavours/${id}`, dto)
  return data
}

export async function deleteFlavour(id: string): Promise<{ ok: boolean }> {
  const { data } = await api.delete<{ ok: boolean }>(`/flavours/${id}`)
  return data
}

export type MenuPayload = {
  items: { sortOrder: number; flavour: Flavour }[]
}

export async function patchTodayMenu(flavourIds: string[]): Promise<MenuPayload> {
  const { data } = await api.patch<MenuPayload>('/menu/today', { flavourIds })
  return data
}

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
}): Promise<CreateOrderResponse> {
  const { data } = await api.post<CreateOrderResponse>('/orders', payload)
  return data
}

export async function createPaymentLink(orderId: string): Promise<{
  checkoutUrl: string
  squareOrderId: string
}> {
  const { data } = await api.post<{
    checkoutUrl: string
    squareOrderId: string
  }>(`/orders/${orderId}/pay`)
  return data
}

export type PublicOrder = {
  id: string
  status: string
  totalCents: number
  createdAt: string
  guestEmail?: string | null
  guestPhone?: string | null
  userId?: string | null
  user?: { email: string } | null
  items: {
    quantity: number
    unitPriceCents: number
    flavour: { name: string }
  }[]
}

export type OrdersListResponse = {
  data: PublicOrder[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export async function getOrder(orderId: string): Promise<PublicOrder> {
  const { data } = await api.get<PublicOrder>(`/orders/${orderId}`)
  return data
}

export async function getMyOrders(query?: {
  page?: number
  limit?: number
}): Promise<OrdersListResponse> {
  const { data } = await api.get<OrdersListResponse>('/orders', { params: query })
  return data
}

export async function getAdminOrders(query?: {
  page?: number
  limit?: number
}): Promise<OrdersListResponse> {
  const { data } = await api.get<OrdersListResponse>('/admin/orders', {
    params: query,
  })
  return data
}

export async function updateAdminOrderStatus(
  orderId: string,
  payload: { status: string },
): Promise<PublicOrder> {
  const { data } = await api.patch<PublicOrder>(
    `/admin/orders/${orderId}/status`,
    payload,
  )
  return data
}
