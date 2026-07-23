import { useQuery } from '@tanstack/react-query'
import { cmsApi } from '@/api/services'

export function useCmsPageSettings<T extends Record<string, unknown>>(
  slug: string,
  defaults: T,
) {
  const query = useQuery({
    queryKey: ['cms-page-public', slug],
    queryFn: () => cmsApi.getPublicPage<Partial<T>>(slug),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    settings: { ...defaults, ...(query.data ?? {}) } as T,
  }
}
