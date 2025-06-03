import { describe, expect, it } from 'vitest'

import { formatFileSize, getFileDirectory, getFileExtension, removeSpecialCharactersForFileName } from '../file'

describe('file', () => {
  describe('getFileDirectory', () => {
    it('should return directory path for normal file path', () => {
      // validate directory extraction for normal file path
      const filePath = 'path/to/file.txt'
      const result = getFileDirectory(filePath)
      expect(result).toBe('path/to')
    })

    it('should return empty string for file without directory', () => {
      // validate file path without directory
      const filePath = 'file.txt'
      const result = getFileDirectory(filePath)
      expect(result).toBe('')
    })

    it('should handle absolute path correctly', () => {
      // validate directory extraction for absolute path
      const filePath = '/root/path/to/file.txt'
      const result = getFileDirectory(filePath)
      expect(result).toBe('/root/path/to')
    })

    it('should handle empty string input', () => {
      // validate boundary case for empty string input
      const filePath = ''
      const result = getFileDirectory(filePath)
      expect(result).toBe('')
    })
  })

  describe('getFileExtension', () => {
    it('should return lowercase extension for normal file', () => {
      // validate extraction of extension for normal file
      const filePath = 'document.pdf'
      const result = getFileExtension(filePath)
      expect(result).toBe('.pdf')
    })

    it('should convert uppercase extension to lowercase', () => {
      // validate converting uppercase extension to lowercase
      const filePath = 'image.PNG'
      const result = getFileExtension(filePath)
      expect(result).toBe('.png')
    })

    it('should return dot only for file without extension', () => {
      // validate file without extension
      const filePath = 'noextension'
      const result = getFileExtension(filePath)
      expect(result).toBe('.')
    })

    it('should handle hidden files with extension', () => {
      // validate hidden file with extension
      const filePath = '.config.json'
      const result = getFileExtension(filePath)
      expect(result).toBe('.json')
    })

    it('should handle empty string input', () => {
      // validate boundary case for empty string input
      const filePath = ''
      const result = getFileExtension(filePath)
      expect(result).toBe('.')
    })
  })

  describe('formatFileSize', () => {
    it('should format size in MB for large files', () => {
      // validate large files formatted in MB
      const size = 1048576 // 1MB
      const result = formatFileSize(size)
      expect(result).toBe('1.0 MB')
    })

    it('should format size in KB for medium files', () => {
      // validate medium files formatted in KB
      const size = 1024 // 1KB
      const result = formatFileSize(size)
      expect(result).toBe('1 KB')
    })

    it('should format small size in KB with decimals', () => {
      // validate small files formatted in KB with decimals
      const size = 500
      const result = formatFileSize(size)
      expect(result).toBe('0.49 KB')
    })

    it('should handle zero size', () => {
      // validate boundary case for zero size
      const size = 0
      const result = formatFileSize(size)
      expect(result).toBe('0.00 KB')
    })
  })

  describe('removeSpecialCharactersForFileName', () => {
    it('should remove invalid characters for filename', () => {
      // validate removal of invalid characters from filename
      expect(removeSpecialCharactersForFileName('Hello:<>World\nTest')).toBe('Hello___World Test')
    })

    it('should return original string if no invalid characters', () => {
      // validate string without invalid characters
      expect(removeSpecialCharactersForFileName('HelloWorld')).toBe('HelloWorld')
    })

    it('should return empty string for empty input', () => {
      // validate empty string
      expect(removeSpecialCharactersForFileName('')).toBe('')
    })
  })
})
