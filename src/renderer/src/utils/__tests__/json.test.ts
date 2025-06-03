import { describe, expect, it } from 'vitest'

import { isJSON, parseJSON } from '../index'

describe('json', () => {
  describe('isJSON', () => {
    it('should return true for valid JSON string', () => {
      // Validate a valid JSON string
      expect(isJSON('{"key": "value"}')).toBe(true)
    })

    it('should return false for empty string', () => {
      // Validate empty string
      expect(isJSON('')).toBe(false)
    })

    it('should return false for invalid JSON string', () => {
      // Validate invalid JSON string
      expect(isJSON('{invalid json}')).toBe(false)
    })

    it('should return false for non-string input', () => {
      // Validate non-string input
      expect(isJSON(123)).toBe(false)
      expect(isJSON({})).toBe(false)
      expect(isJSON(null)).toBe(false)
      expect(isJSON(undefined)).toBe(false)
    })
  })

  describe('parseJSON', () => {
    it('should parse valid JSON string to object', () => {
      // Validate parsing of valid JSON string
      const result = parseJSON('{"key": "value"}')
      expect(result).toEqual({ key: 'value' })
    })

    it('should return null for invalid JSON string', () => {
      // Validate that invalid JSON string returns null
      const result = parseJSON('{invalid json}')
      expect(result).toBe(null)
    })
  })
})
