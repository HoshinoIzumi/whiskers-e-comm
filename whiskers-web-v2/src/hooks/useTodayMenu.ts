import { useQuery } from '@tanstack/react-query'
import { getTodayMenu } from '../lib/api'
import type { Flavour } from '../lib/api'

export function useTodayMenu() {
  return useQuery<Flavour[]>({
    queryKey: ['today-menu'],
    queryFn: getTodayMenu,
  })
}

