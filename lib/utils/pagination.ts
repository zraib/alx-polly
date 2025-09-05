export interface PaginationInfo {
  currentPage: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationInfo
}

export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit)
  
  return {
    currentPage: page,
    limit,
    totalCount: total,
    totalPages,
    hasNext: page < totalPages - 1,
    hasPrev: page > 0
  }
}

export function getOffset(page: number, limit: number): number {
  return page * limit
}

export function validatePaginationParams(
  page?: number | string,
  limit?: number | string
): { page: number; limit: number } {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit
  
  return {
    page: Math.max(0, parsedPage || 0),
    limit: Math.min(100, Math.max(1, parsedLimit || 10)) // Max 100 items per page
  }
}

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// Helper for URL search params
export function getPaginationFromSearchParams(searchParams: URLSearchParams) {
  return validatePaginationParams(
    searchParams.get('page') || undefined,
    searchParams.get('limit') || undefined
  )
}

// Helper for creating pagination URLs
export function createPaginationUrl(
  baseUrl: string,
  page: number,
  limit: number,
  additionalParams?: Record<string, string>
): string {
  const url = new URL(baseUrl, window.location.origin)
  url.searchParams.set('page', page.toString())
  url.searchParams.set('limit', limit.toString())
  
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}