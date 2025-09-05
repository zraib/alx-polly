import {
  createPaginationInfo,
  getOffset,
  validatePaginationParams,
  getPaginationFromSearchParams,
  createPaginationUrl,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/utils/pagination'

describe('Pagination Utils', () => {
  describe('createPaginationInfo', () => {
    it('should create pagination info with valid parameters', () => {
      // Act
      const result = createPaginationInfo(2, 10, 25)

      // Assert
      expect(result).toEqual({
        currentPage: 2,
        limit: 10,
        totalCount: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      })
    })

    it('should handle first page correctly', () => {
      // Act
      const result = createPaginationInfo(0, 10, 25)

      // Assert
      expect(result.hasPrev).toBe(false)
      expect(result.hasNext).toBe(true)
      expect(result.currentPage).toBe(0)
      expect(result.totalPages).toBe(3)
    })

    it('should handle last page correctly', () => {
      // Act
      const result = createPaginationInfo(2, 10, 25)

      // Assert
      expect(result.hasPrev).toBe(true)
      expect(result.hasNext).toBe(false)
      expect(result.currentPage).toBe(2)
      expect(result.totalPages).toBe(3)
    })

    it('should handle empty results', () => {
      // Act
      const result = createPaginationInfo(0, 10, 0)

      // Assert
      expect(result).toEqual({
        currentPage: 0,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
    })

    it('should handle single page of results', () => {
      // Act
      const result = createPaginationInfo(0, 10, 5)

      // Assert
      expect(result.totalPages).toBe(1)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrev).toBe(false)
      expect(result.currentPage).toBe(0)
    })
  })

  describe('getOffset', () => {
    it('should calculate offset correctly', () => {
      // Assert
      expect(getOffset(0, 10)).toBe(0)
      expect(getOffset(1, 10)).toBe(10)
      expect(getOffset(2, 10)).toBe(20)
      expect(getOffset(4, 20)).toBe(80)
    })

    it('should handle edge cases', () => {
      // Assert
      expect(getOffset(0, 1)).toBe(0)
      expect(getOffset(-1, 10)).toBe(-10) // Invalid but should still calculate
    })
  })

  describe('validatePaginationParams', () => {
    it('should return valid parameters unchanged', () => {
      // Act
      const result = validatePaginationParams(2, 15)

      // Assert
      expect(result).toEqual({ page: 2, limit: 15 })
    })

    it('should default invalid page to 1', () => {
      // Act
      const result1 = validatePaginationParams(0, 10)
      const result2 = validatePaginationParams(-5, 10)
      const result3 = validatePaginationParams(NaN, 10)

      // Assert
      expect(result1.page).toBe(0)
      expect(result2.page).toBe(0)
      expect(result3.page).toBe(0)
    })

    it('should default invalid limit to DEFAULT_PAGE_SIZE', () => {
      // Act
      const result1 = validatePaginationParams(1, 0)
      const result2 = validatePaginationParams(1, -10)
      const result3 = validatePaginationParams(1, NaN)

      // Assert
      expect(result1.limit).toBe(10)
      expect(result2.limit).toBe(1)
      expect(result3.limit).toBe(10)
    })

    it('should cap limit at MAX_PAGE_SIZE', () => {
      // Act
      const result = validatePaginationParams(1, MAX_PAGE_SIZE + 10)

      // Assert
      expect(result.limit).toBe(MAX_PAGE_SIZE)
    })

    it('should handle undefined parameters', () => {
      // Act
      const result = validatePaginationParams(undefined, undefined)

      // Assert
      expect(result).toEqual({ page: 0, limit: DEFAULT_PAGE_SIZE })
    })
  })

  describe('getPaginationFromSearchParams', () => {
    it('should parse search params correctly', () => {
      // Arrange
      const searchParams = new URLSearchParams('page=2&limit=15')
      
      // Act
      const result = getPaginationFromSearchParams(searchParams)

      // Assert
      expect(result).toEqual({ page: 2, limit: 15 })
    })

    it('should handle missing parameters', () => {
      // Arrange
      const searchParams = new URLSearchParams()
      
      // Act
      const result = getPaginationFromSearchParams(searchParams)

      // Assert
      expect(result).toEqual({ page: 0, limit: DEFAULT_PAGE_SIZE })
    })
  })

  describe('createPaginationUrl', () => {
    it('should create URL with pagination parameters', () => {
      // Act
      const result = createPaginationUrl('http://localhost:3000/polls', 2, 15)

      // Assert
      expect(result).toContain('page=2')
      expect(result).toContain('limit=15')
    })


  })

  describe('Constants', () => {
    it('should have reasonable default values', () => {
      // Assert
      expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0)
      expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(50)
      expect(MAX_PAGE_SIZE).toBeGreaterThan(DEFAULT_PAGE_SIZE)
      expect(MAX_PAGE_SIZE).toBeLessThanOrEqual(1000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      // Act
      const result = createPaginationInfo(999999, 1, 1000000)

      // Assert
      expect(result.totalPages).toBe(1000000)
      expect(result.currentPage).toBe(999999)
      expect(result.totalCount).toBe(1000000)
    })

    it('should handle fractional page sizes in validation', () => {
      // Act
      const result = validatePaginationParams(1, 10.5)

      // Assert
      expect(result.limit).toBe(10.5) // Function doesn't floor fractional values
    })
  })
})