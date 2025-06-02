import { describe, expect, it } from 'vitest'

import {
  firstLetter,
  generateColorFromChar,
  getBriefInfo,
  getDefaultGroupName,
  getFirstCharacter,
  getLeadingEmoji,
  isEmoji,
  removeLeadingEmoji,
  removeSpecialCharactersForTopicName
} from '../naming'

describe('naming', () => {
  describe('firstLetter', () => {
    it('should return first letter of string', () => {
      // Verify first character of a regular string
      expect(firstLetter('Hello')).toBe('H')
    })

    it('should return first emoji of string', () => {
      // Verify string containing emoji
      expect(firstLetter('😊Hello')).toBe('😊')
    })

    it('should return empty string for empty input', () => {
      // Verify empty string
      expect(firstLetter('')).toBe('')
    })
  })

  describe('removeLeadingEmoji', () => {
    it('should remove leading emoji from string', () => {
      // Verify removing leading emoji
      expect(removeLeadingEmoji('😊Hello')).toBe('Hello')
    })

    it('should return original string if no leading emoji', () => {
      // Verify string without emoji
      expect(removeLeadingEmoji('Hello')).toBe('Hello')
    })

    it('should return empty string if only emojis', () => {
      // Verify string with only emojis
      expect(removeLeadingEmoji('😊😊')).toBe('')
    })
  })

  describe('getLeadingEmoji', () => {
    it('should return leading emoji from string', () => {
      // Verify extracting leading emoji
      expect(getLeadingEmoji('😊Hello')).toBe('😊')
    })

    it('should return empty string if no leading emoji', () => {
      // Verify string without emoji
      expect(getLeadingEmoji('Hello')).toBe('')
    })

    it('should return all emojis if only emojis', () => {
      // Verify string with only emojis
      expect(getLeadingEmoji('😊😊')).toBe('😊😊')
    })
  })

  describe('isEmoji', () => {
    it('should return true for pure emoji string', () => {
      // Verify pure emoji string returns true
      expect(isEmoji('😊')).toBe(true)
    })

    it('should return false for mixed emoji and text string', () => {
      // Verify mixed emoji and text string returns false
      expect(isEmoji('😊Hello')).toBe(false)
    })

    it('should return false for non-emoji string', () => {
      // Verify non-emoji string returns false
      expect(isEmoji('Hello')).toBe(false)
    })

    it('should return false for data URI or URL', () => {
      // Verify data URI or URL string returns false
      expect(isEmoji('data:image/png;base64,...')).toBe(false)
      expect(isEmoji('https://example.com')).toBe(false)
    })
  })

  describe('removeSpecialCharactersForTopicName', () => {
    it('should replace newlines with space for topic name', () => {
      // Verify replacing newlines with space
      expect(removeSpecialCharactersForTopicName('Hello\nWorld')).toBe('Hello World')
    })

    it('should return original string if no newlines', () => {
      // Verify string without newlines
      expect(removeSpecialCharactersForTopicName('Hello World')).toBe('Hello World')
    })

    it('should return empty string for empty input', () => {
      // Verify empty string
      expect(removeSpecialCharactersForTopicName('')).toBe('')
    })
  })

  describe('getDefaultGroupName', () => {
    it('should extract group name from ID with slash', () => {
      // Verify extracting group name from ID containing slash
      expect(getDefaultGroupName('group/model')).toBe('group')
    })

    it('should extract group name from ID with colon', () => {
      // Verify extracting group name from ID containing colon
      expect(getDefaultGroupName('group:model')).toBe('group')
    })

    it('should extract group name from ID with space', () => {
      // Verify extracting group name from ID containing space
      expect(getDefaultGroupName('group model')).toBe('group')
    })

    it('should extract group name from ID with hyphen', () => {
      // Verify extracting group name from ID containing hyphen
      expect(getDefaultGroupName('group-model')).toBe('group-model')
    })

    it('should handle special cases for specific providers', () => {
      // For these providers, '/', ' ', '-', '_', ':' are all first-class separators, take the 0th part after splitting
      const specialProviders = ['aihubmix', 'silicon', 'ocoolai', 'o3', 'dmxapi']
      specialProviders.forEach((provider) => {
        expect(getDefaultGroupName('Qwen/Qwen3-32B', provider)).toBe('qwen')
        expect(getDefaultGroupName('gpt-4.1-mini', provider)).toBe('gpt')
        expect(getDefaultGroupName('gpt-4.1', provider)).toBe('gpt')
        expect(getDefaultGroupName('gpt_4.1', provider)).toBe('gpt')
        expect(getDefaultGroupName('DeepSeek Chat', provider)).toBe('deepseek')
        expect(getDefaultGroupName('foo:bar', provider)).toBe('foo')
      })
    })

    it('should handle default separator behavior', () => {
      // By default, '/', ' ', ':' are first-class separators, '-' and '_' are second-class
      expect(getDefaultGroupName('custom/model-name', 'foobar')).toBe('custom')
      expect(getDefaultGroupName('custom model:name', 'foobar')).toBe('custom')
      expect(getDefaultGroupName('custom-model_name', 'foobar')).toBe('custom-model_name')
    })

    it('should fallback to id if no delimiters', () => {
      // Return id when no separators are present
      const specialProviders = ['aihubmix', 'silicon', 'ocoolai', 'o3', 'dmxapi']
      specialProviders.forEach((provider) => {
        expect(getDefaultGroupName('o3', provider)).toBe('o3')
      })
      expect(getDefaultGroupName('o3', 'openai')).toBe('o3')
    })
  })

  describe('generateColorFromChar', () => {
    it('should generate valid hex color code', () => {
      // Verify generating valid hex color code
      const color = generateColorFromChar('A')
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should generate consistent colors for same input', () => {
      // Verify consistent colors for same input
      const color1 = generateColorFromChar('test')
      const color2 = generateColorFromChar('test')
      expect(color1).toBe(color2)
    })

    it('should generate different colors for different inputs', () => {
      // Verify different colors for different inputs
      const color1 = generateColorFromChar('A')
      const color2 = generateColorFromChar('B')
      expect(color1).not.toBe(color2)
    })
  })

  describe('getFirstCharacter', () => {
    it('should return first character of string', () => {
      // Verify returning first character of string
      expect(getFirstCharacter('Hello')).toBe('H')
    })

    it('should return empty string for empty input', () => {
      // Verify empty string for empty input
      expect(getFirstCharacter('')).toBe('')
    })

    it('should handle special characters and emojis', () => {
      // Verify handling special characters and emojis
      expect(getFirstCharacter('😊Hello')).toBe('😊')
    })
  })

  describe('getBriefInfo', () => {
    it('should return original text if under max length', () => {
      // Verify returning original text if under max length
      const text = 'Short text'
      expect(getBriefInfo(text, 20)).toBe('Short text')
    })

    it('should truncate text at word boundary with ellipsis', () => {
      // Verify truncating text at word boundary with ellipsis
      const text = 'This is a long text that needs truncation'
      const result = getBriefInfo(text, 10)
      expect(result).toBe('This is a...')
    })

    it('should handle empty lines by removing them', () => {
      // Verify removing empty lines
      const text = 'Line1\n\nLine2'
      expect(getBriefInfo(text, 20)).toBe('Line1\nLine2')
    })

    it('should handle custom max length', () => {
      // Verify handling custom max length
      const text = 'This is a long text'
      expect(getBriefInfo(text, 5)).toBe('This...')
    })
  })
})
