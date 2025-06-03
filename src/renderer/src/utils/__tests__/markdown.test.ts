import { describe, expect, it } from 'vitest'

import { convertMathFormula, findCitationInChildren, removeTrailingDoubleSpaces } from '../markdown'

describe('markdown', () => {
  describe('findCitationInChildren', () => {
    it('returns null when children is null or undefined', () => {
      expect(findCitationInChildren(null)).toBeNull()
      expect(findCitationInChildren(undefined)).toBeNull()
    })

    it('finds citation in direct child element', () => {
      const children = [{ props: { 'data-citation': 'test-citation' } }]
      expect(findCitationInChildren(children)).toBe('test-citation')
    })

    it('finds citation in nested child element', () => {
      const children = [
        {
          props: {
            children: [{ props: { 'data-citation': 'nested-citation' } }]
          }
        }
      ]
      expect(findCitationInChildren(children)).toBe('nested-citation')
    })

    it('returns null when no citation is found', () => {
      const children = [{ props: { foo: 'bar' } }, { props: { children: [{ props: { baz: 'qux' } }] } }]
      expect(findCitationInChildren(children)).toBeNull()
    })

    it('handles single child object (non-array)', () => {
      const child = { props: { 'data-citation': 'single-citation' } }
      expect(findCitationInChildren(child)).toBe('single-citation')
    })

    it('handles deeply nested structures', () => {
      const children = [
        {
          props: {
            children: [
              {
                props: {
                  children: [
                    {
                      props: {
                        children: {
                          props: { 'data-citation': 'deep-citation' }
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
      expect(findCitationInChildren(children)).toBe('deep-citation')
    })

    it('handles non-object children gracefully', () => {
      const children = ['text node', 123, { props: { 'data-citation': 'mixed-citation' } }]
      expect(findCitationInChildren(children)).toBe('mixed-citation')
    })
  })

  describe('convertMathFormula', () => {
    it('should convert LaTeX block delimiters to $$$$', () => {
      // Verify converting LaTeX block delimiters to $$$$
      const input = 'Some text \\[math formula\\] more text'
      const result = convertMathFormula(input)
      expect(result).toBe('Some text $$math formula$$ more text')
    })

    it('should convert LaTeX inline delimiters to $$', () => {
      // Verify converting LaTeX inline delimiters to $$
      const input = 'Some text \\(inline math\\) more text'
      const result = convertMathFormula(input)
      expect(result).toBe('Some text $inline math$ more text')
    })

    it('should handle multiple delimiters in input', () => {
      // Verify handling multiple delimiters in input
      const input = 'Text \\[block1\\] and \\(inline\\) and \\[block2\\]'
      const result = convertMathFormula(input)
      expect(result).toBe('Text $$block1$$ and $inline$ and $$block2$$')
    })

    it('should return input unchanged if no delimiters', () => {
      // Verify returning original input if no delimiters
      const input = 'Some text without math'
      const result = convertMathFormula(input)
      expect(result).toBe('Some text without math')
    })

    it('should return input if null or empty', () => {
      // Verify returning original value for empty or null input
      expect(convertMathFormula('')).toBe('')
      expect(convertMathFormula(null)).toBe(null)
    })
  })

  describe('removeTrailingDoubleSpaces', () => {
    it('should remove trailing double spaces from each line', () => {
      // Verify removing two spaces at the end of each line
      const input = 'Line one  \nLine two  \nLine three'
      const result = removeTrailingDoubleSpaces(input)
      expect(result).toBe('Line one\nLine two\nLine three')
    })

    it('should handle single line with trailing double spaces', () => {
      // Verify handling a single line ending with two spaces
      const input = 'Single line  '
      const result = removeTrailingDoubleSpaces(input)
      expect(result).toBe('Single line')
    })

    it('should return unchanged if no trailing double spaces', () => {
      // Verify returning original input if no trailing double spaces
      const input = 'Line one\nLine two \nLine three'
      const result = removeTrailingDoubleSpaces(input)
      expect(result).toBe('Line one\nLine two \nLine three')
    })

    it('should handle empty string', () => {
      // Verify handling empty string
      const input = ''
      const result = removeTrailingDoubleSpaces(input)
      expect(result).toBe('')
    })
  })
})
