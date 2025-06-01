import { KB, MB } from '@shared/config/constant'

/**
 * Extracts the directory path from a file path.
 * @param filePath The file path
 * @returns string The directory path
 */
export function getFileDirectory(filePath: string) {
  const parts = filePath.split('/')
  const directory = parts.slice(0, -1).join('/')
  return directory
}

/**
 * Extracts the file extension from a file path.
 * @param filePath The file path
 * @returns string The file extension in lowercase, or '.' if none exists
 */
export function getFileExtension(filePath: string) {
  const parts = filePath.split('.')
  if (parts.length > 1) {
    const extension = parts.slice(-1)[0].toLowerCase()
    return '.' + extension
  }
  return '.'
}

/**
 * Formats a file size, returning a string in MB or KB based on the size.
 * @param size File size in bytes
 * @returns string Formatted file size string
 */
export function formatFileSize(size: number) {
  if (size >= MB) {
    return (size / MB).toFixed(1) + ' MB'
  }

  if (size >= KB) {
    return (size / KB).toFixed(0) + ' KB'
  }

  return (size / KB).toFixed(2) + ' KB'
}

/**
 * Removes special characters from a filename:
 * - Replaces illegal characters with underscores
 * - Replaces newline characters with spaces
 * @param str Input string
 * @returns string Processed filename string
 */
export function removeSpecialCharactersForFileName(str: string) {
  return str
    .replace(/[<>:"/\\|?*.]/g, '_')
    .replace(/[\r\n]+/g, ' ')
    .trim()
}
