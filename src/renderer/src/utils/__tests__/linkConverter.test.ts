import { describe, expect, it } from 'vitest'

import {
  cleanLinkCommas,
  completeLinks,
  convertLinks,
  convertLinksToHunyuan,
  convertLinksToOpenRouter,
  convertLinksToZhipu,
  extractUrlsFromMarkdown
} from '../linkConverter'

describe('linkConverter', () => {
  describe('convertLinksToZhipu', () => {
    it('should correctly convert complete [ref_N] format', () => {
      const input = 'Here is a reference [ref_1] and another [ref_2]'
      const result = convertLinksToZhipu(input, true)
      expect(result).toBe('Here is a reference [<sup>1</sup>]() and another [<sup>2</sup>]()')
    })

    it('should handle chunked input and preserve incomplete link patterns', () => {
      // The first chunk contains an incomplete pattern
      const chunk1 = 'This is the first part [ref'
      const result1 = convertLinksToZhipu(chunk1, true)
      expect(result1).toBe('This is the first part ')

      // The second chunk completes the pattern
      const chunk2 = '_1] This is the rest'
      const result2 = convertLinksToZhipu(chunk2, false)
      expect(result2).toBe('[<sup>1</sup>]() This is the rest')
    })

    it('should clear buffer when resetting counter', () => {
      // First convert without reset
      const input1 = 'First input [ref_1]'
      convertLinksToZhipu(input1, false)

      // Then reset and convert new input
      const input2 = 'New input [ref_2]'
      const result = convertLinksToZhipu(input2, true)
      expect(result).toBe('New input [<sup>2</sup>]()')
    })
  })

  describe('convertLinksToHunyuan', () => {
    it('should correctly convert [N](@ref) format to links with URLs', () => {
      const webSearch = [{ url: 'https://example.com/1' }, { url: 'https://example.com/2' }]
      const input = 'Here is a single reference [1](@ref) and multiple references [2](@ref)'
      const result = convertLinksToHunyuan(input, webSearch, true)
      expect(result).toBe(
        'Here is a single reference [<sup>1</sup>](https://example.com/1) and multiple references [<sup>2</sup>](https://example.com/2)'
      )
    })

    it('should correctly handle comma-separated multiple references', () => {
      const webSearch = [
        { url: 'https://example.com/1' },
        { url: 'https://example.com/2' },
        { url: 'https://example.com/3' }
      ]
      const input = 'Here are multiple references [1, 2, 3](@ref)'
      const result = convertLinksToHunyuan(input, webSearch, true)
      expect(result).toBe(
        'Here are multiple references [<sup>1</sup>](https://example.com/1)[<sup>2</sup>](https://example.com/2)[<sup>3</sup>](https://example.com/3)'
      )
    })

    it('should handle non-existent reference indices', () => {
      const webSearch = [{ url: 'https://example.com/1' }]
      const input = 'Here is an out-of-range reference [2](@ref)'
      const result = convertLinksToHunyuan(input, webSearch, true)
      expect(result).toBe('Here is an out-of-range reference [<sup>2</sup>](@ref)')
    })

    it('should handle incomplete reference formats in chunked input', () => {
      const webSearch = [{ url: 'https://example.com/1' }]
      // The first chunk contains an incomplete pattern
      const chunk1 = 'This is the first part ['
      const result1 = convertLinksToHunyuan(chunk1, webSearch, true)
      expect(result1).toBe('This is the first part ')

      // The second chunk completes the pattern
      const chunk2 = '1](@ref) This is the rest'
      const result2 = convertLinksToHunyuan(chunk2, webSearch, false)
      expect(result2).toBe('[<sup>1</sup>](https://example.com/1) This is the rest')
    })
  })

  describe('convertLinks', () => {
    it('should convert links with domain-like text to numbered links', () => {
      const input = 'Check out this website [example.com](https://example.com)'
      const result = convertLinks(input, true)
      expect(result).toBe('Check out this website [<sup>1</sup>](https://example.com)')
    })

    it('should handle parenthesized link format ([host](url))', () => {
      const input = 'Here is a link ([example.com](https://example.com))'
      const result = convertLinks(input, true)
      expect(result).toBe('Here is a link [<sup>1</sup>](https://example.com)')
    })

    it('should use the same counter for duplicate URLs', () => {
      const input =
        'First link [example.com](https://example.com) and second same link [subdomain.example.com](https://example.com)'
      const result = convertLinks(input, true)
      expect(result).toBe(
        'First link [<sup>1</sup>](https://example.com) and second same link [<sup>1</sup>](https://example.com)'
      )
    })
  })

  describe('convertLinksToOpenRouter', () => {
    it('should only convert links with domain-like text', () => {
      const input = 'Website [example.com](https://example.com) and [Click here](https://other.com)'
      const result = convertLinksToOpenRouter(input, true)
      expect(result).toBe('Website [<sup>1</sup>](https://example.com) and [Click here](https://other.com)')
    })

    it('should use the same counter for duplicate URLs', () => {
      const input = 'Two identical links [example.com](https://example.com) and [example.org](https://example.com)'
      const result = convertLinksToOpenRouter(input, true)
      expect(result).toBe(
        'Two identical links [<sup>1</sup>](https://example.com) and [<sup>1</sup>](https://example.com)'
      )
    })

    it('should handle incomplete links in chunked input', () => {
      // The first chunk contains an incomplete link
      const chunk1 = 'This is a domain link ['
      const result1 = convertLinksToOpenRouter(chunk1, true)
      expect(result1).toBe('This is a domain link ')

      // The second chunk completes the link
      const chunk2 = 'example.com](https://example.com)'
      const result2 = convertLinksToOpenRouter(chunk2, false)
      expect(result2).toBe('[<sup>1</sup>](https://example.com)')
    })
  })

  describe('completeLinks', () => {
    it('should complete empty links with webSearch data', () => {
      const webSearch = [{ link: 'https://example.com/1' }, { link: 'https://example.com/2' }]
      const input = 'Reference [<sup>1</sup>]() and [<sup>2</sup>]()'
      const result = completeLinks(input, webSearch)
      expect(result).toBe('Reference [<sup>1</sup>](https://example.com/1) and [<sup>2</sup>](https://example.com/2)')
    })

    it('should preserve link format when URL not found', () => {
      const webSearch = [{ link: 'https://example.com/1' }]
      const input = 'Reference [<sup>1</sup>]() and [<sup>2</sup>]()'
      const result = completeLinks(input, webSearch)
      expect(result).toBe('Reference [<sup>1</sup>](https://example.com/1) and [<sup>2</sup>]()')
    })

    it('should handle empty webSearch array', () => {
      const webSearch: any[] = []
      const input = 'Reference [<sup>1</sup>]() and [<sup>2</sup>]()'
      const result = completeLinks(input, webSearch)
      expect(result).toBe('Reference [<sup>1</sup>]() and [<sup>2</sup>]()')
    })
  })

  describe('extractUrlsFromMarkdown', () => {
    it('should extract URLs from all link formats', () => {
      const input =
        'Here is a normal link [text](https://example.com) and numbered link [<sup>1</sup>](https://other.com) and parenthesis link ([domain](https://third.com))'
      const result = extractUrlsFromMarkdown(input)
      expect(result).toEqual(['https://example.com', 'https://other.com', 'https://third.com'])
    })

    it('should deduplicate URLs', () => {
      const input = 'Duplicate link [link1](https://example.com) and [link2](https://example.com)'
      const result = extractUrlsFromMarkdown(input)
      expect(result).toEqual(['https://example.com'])
    })

    it('should filter invalid URLs', () => {
      const input = 'Valid link [link](https://example.com) and invalid link [link](invalid-url)'
      const result = extractUrlsFromMarkdown(input)
      expect(result.length).toBe(1)
      expect(result[0]).toBe('https://example.com')
    })

    it('should handle empty string', () => {
      const input = ''
      const result = extractUrlsFromMarkdown(input)
      expect(result).toEqual([])
    })
  })

  describe('cleanLinkCommas', () => {
    it('should remove commas between links', () => {
      const input = '[Link1](https://example.com),[Link2](https://other.com)'
      const result = cleanLinkCommas(input)
      expect(result).toBe('[Link1](https://example.com)[Link2](https://other.com)')
    })

    it('should handle commas with spaces between links', () => {
      const input = '[Link1](https://example.com) , [Link2](https://other.com)'
      const result = cleanLinkCommas(input)
      expect(result).toBe('[Link1](https://example.com)[Link2](https://other.com)')
    })
  })
})
