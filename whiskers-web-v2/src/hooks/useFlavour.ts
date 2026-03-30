import { useQuery } from '@tanstack/react-query'
import { getFlavour } from '../lib/api'
import type { Flavour } from '../lib/api'

export function useFlavour(id?: string) {
  return useQuery<Flavour>({
    queryKey: ['flavour', id],
    queryFn: () => getFlavour(id!),
    enabled: !!id,
  })
}

