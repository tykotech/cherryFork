import { describe, expect, it } from 'vitest'

import { droppableReorder, sortByEnglishFirst } from '../sort'

describe('sort', () => {
  describe('droppableReorder', () => {
    it('should reorder elements by moving single element forward', () => {
      const list = [1, 2, 3, 4, 5]
      const result = droppableReorder(list, 0, 2)
      expect(result).toEqual([2, 3, 1, 4, 5])
    })

    it('should reorder elements by moving single element backward', () => {
      const list = [1, 2, 3, 4, 5]
      const result = droppableReorder(list, 4, 1)
      expect(result).toEqual([1, 5, 2, 3, 4])
    })

    it('should support multi-element drag reordering while preserving group order', () => {
      const list = [1, 2, 3, 4, 5]
      const result = droppableReorder(list, 1, 3, 2)
      // Move [2,3] after '4', result should be [1, 4, 2, 3, 5]
      expect(result).toEqual([1, 4, 2, 3, 5])
    })

    it('should handle complex multi-element reordering while preserving group order', () => {
      const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      const result = droppableReorder(list, 2, 5, 3)
      // Move [c,d,e] after 'f', result should be ['a', 'b', 'f', 'c', 'd', 'e', 'g']
      expect(result).toEqual(['a', 'b', 'f', 'c', 'd', 'e', 'g'])
    })

    it('should maintain internal order of multi-element group when moving forward', () => {
      const list = [1, 2, 3, 4, 5, 6, 7]
      const result = droppableReorder(list, 1, 5, 3)
      // Move [2,3,4] after '6', result should be [1,5,6,2,3,4,7]
      expect(result).toEqual([1, 5, 6, 2, 3, 4, 7])
    })

    it('should maintain internal order of multi-element group when moving backward', () => {
      const list = [1, 2, 3, 4, 5, 6, 7]
      const result = droppableReorder(list, 4, 1, 3)
      // Move [5,6,7] before '2', result should be [1,5,6,7,2,3,4]
      expect(result).toEqual([1, 5, 6, 7, 2, 3, 4])
    })

    it('should handle empty list', () => {
      const list: number[] = []
      const result = droppableReorder(list, 0, 0)
      expect(result).toEqual([])
    })

    it('should not modify original list', () => {
      const list = [1, 2, 3, 4, 5]
      const originalList = [...list]
      droppableReorder(list, 0, 2)
      expect(list).toEqual(originalList)
    })

    it('should handle string list', () => {
      const list = ['a', 'b', 'c', 'd']
      const result = droppableReorder(list, 0, 2)
      expect(result).toEqual(['b', 'c', 'a', 'd'])
    })

    it('should handle object list', () => {
      const list = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const result = droppableReorder(list, 0, 2)
      expect(result).toEqual([{ id: 2 }, { id: 3 }, { id: 1 }])
    })
  })

  describe('sortByEnglishFirst', () => {
    it('should sort English before Chinese', () => {
      expect(sortByEnglishFirst('apple', '苹果')).toBe(-1)
      expect(sortByEnglishFirst('苹果', 'apple')).toBe(1)
    })

    it('should sort two English strings alphabetically', () => {
      const result = sortByEnglishFirst('banana', 'apple')
      expect(result).toBeGreaterThan(0) // 'banana' comes after 'apple'
    })

    it('should sort two non-English strings using localeCompare', () => {
      const result = sortByEnglishFirst('苹果', '香蕉')
      // The result depends on localeCompare, but should be consistent in the same environment
      expect(typeof result).toBe('number')
    })

    it('should handle empty strings', () => {
      expect(sortByEnglishFirst('', 'a')).toBeGreaterThan(0) // Empty string doesn't start with English letter
      expect(sortByEnglishFirst('a', '')).toBeLessThan(0)
    })

    it('should handle non-letter starting strings', () => {
      expect(sortByEnglishFirst('1apple', 'apple')).toBeGreaterThan(0) // Numbers don't count as English letters
      expect(sortByEnglishFirst('apple', '1apple')).toBeLessThan(0)
    })

    it('should handle case sensitivity', () => {
      expect(sortByEnglishFirst('Apple', 'banana')).toBeLessThan(0) // Uppercase letters are also English
      expect(sortByEnglishFirst('apple', 'Banana')).toBeLessThan(0) // Sort alphabetically
    })

    it('should handle special characters', () => {
      expect(sortByEnglishFirst('#apple', 'banana')).toBeGreaterThan(0) // Special characters don't count as English letters
      expect(sortByEnglishFirst('apple', '#banana')).toBeLessThan(0)
    })
  })
})
