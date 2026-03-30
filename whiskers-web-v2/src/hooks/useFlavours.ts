import { useQuery } from '@tanstack/react-query'
import { getFlavours } from '../lib/api'
import type { FlavoursListResponse } from '../lib/api'

export function useFlavours(query?: {
  page?: number
  limit?: number
  categoryId?: string
  search?: string
}) {
  const { page = 1, limit = 50, categoryId, search } = query ?? {}

  return useQuery<FlavoursListResponse>({
    queryKey: ['flavours', { page, limit, categoryId, search }],
    queryFn: () => getFlavours({ page, limit, categoryId, search }),
  })
}

