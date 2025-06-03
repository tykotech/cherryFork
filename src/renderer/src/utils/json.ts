/**
 * Determine if a string is a JSON string
 * @param str The string
 */
export function isJSON(str: any): boolean {
  if (typeof str !== 'string') {
    return false
  }

  try {
    return typeof JSON.parse(str) === 'object'
  } catch (e) {
    return false
  }
}

/**
 * Try to parse a JSON string, return null if parsing fails.
 * @param str The string to parse
 * @returns The parsed object, or null if parsing fails
 */
export function parseJSON(str: string) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}
