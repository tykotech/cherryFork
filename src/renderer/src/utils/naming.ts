/**
 * Extract default group name from model ID.
 * Rules:
 * 1. First delimiter rule: split by first occurring delimiter and take part 0 as group name.
 * 2. Second delimiter rule: concatenate first two parts (e.g., 'a-b-c' => 'a-b').
 * 3. Otherwise return id.
 *
 * Examples:
 * - 'gpt-3.5-turbo-16k-0613' => 'gpt-3.5'
 * - 'qwen3:32b' => 'qwen3'
 * - 'Qwen/Qwen3-32b' => 'qwen'
 * - 'deepseek-r1' => 'deepseek-r1'
 * - 'o3' => 'o3'
 *
 * @param id model ID string
 * @param provider provider ID string
 * @returns extracted group name string
 */
export const getDefaultGroupName = (id: string, provider?: string) => {
  const str = id.toLowerCase()

  // Define delimiters
  let firstDelimiters = ['/', ' ', ':']
  let secondDelimiters = ['-', '_']

  if (provider && ['aihubmix', 'silicon', 'ocoolai', 'o3', 'dmxapi'].includes(provider.toLowerCase())) {
    firstDelimiters = ['/', ' ', '-', '_', ':']
    secondDelimiters = []
  }

  // First delimiter rule
  for (const delimiter of firstDelimiters) {
    if (str.includes(delimiter)) {
      return str.split(delimiter)[0]
    }
  }

  // Second delimiter rule
  for (const delimiter of secondDelimiters) {
    if (str.includes(delimiter)) {
      const parts = str.split(delimiter)
      return parts.length > 1 ? parts[0] + '-' + parts[1] : parts[0]
    }
  }

  return str
}

/**
 * Helper to get avatar name: takes first character, supports emojis.
 * @param str Input string
 * @returns first character or empty string
 */
export function firstLetter(str: string): string {
  const match = str?.match(/\p{L}\p{M}*|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u)
  return match ? match[0] : ''
}

/**
 * Remove leading emojis from string
 * @param str Input string
 * @returns string without leading emojis
 */
export function removeLeadingEmoji(str: string): string {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+/u
  return str.replace(emojiRegex, '').trim()
}

/**
 * Extract leading emojis from string
 * @param str Input string
 * @returns leading emojis or empty string
 */
export function getLeadingEmoji(str: string): string {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+/u
  const match = str.match(emojiRegex)
  return match ? match[0] : ''
}

/**
 * Check if string is pure emojis
 * @param str Input string
 * @returns true if string is pure emojis, else false
 */
export function isEmoji(str: string): boolean {
  if (str.startsWith('data:')) {
    return false
  }
  if (str.startsWith('http')) {
    return false
  }
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+$/u
  const match = str.match(emojiRegex)
  return !!match
}

/**
 * Remove special characters from topic name:
 * - replace newlines with spaces.
 * @param str input string
 * @returns processed string
 */
export function removeSpecialCharactersForTopicName(str: string) {
  return str.replace(/[\r\n]+/g, ' ').trim()
}

/**
 * Generate color code from character for avatar
 * @param char input character
 * @returns hex color string
 */
export function generateColorFromChar(char: string) {
  // Use char code as seed
  const seed = char.charCodeAt(0)

  // Use simple LCG to PRNG
  const a = 1664525
  const c = 1013904223
  const m = Math.pow(2, 32)

  // Generate 3 PRNs as RGB
  let r = (a * seed + c) % m
  let g = (a * r + c) % m
  let b = (a * g + c) % m

  // Convert to 0-255 ints
  r = Math.floor((r / m) * 256)
  g = Math.floor((g / m) * 256)
  b = Math.floor((b / m) * 256)

  // Return hex color string
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Get first character of string
 * @param str input string
 * @returns first character or empty string
 */
export function getFirstCharacter(str) {
  if (str.length === 0) return ''

  // use for...of loop to get first character
  for (const char of str) {
    return char
  }
}

/**
 * Simplify text: truncate by max length at word boundary.
 * @param text input text
 * @param maxLength maximum length, default 50
 * @returns processed brief text
 */
export function getBriefInfo(text: string, maxLength: number = 50): string {
  // Remove empty lines
  const noEmptyLinesText = text.replace(/\n\s*\n/g, '\n')

  // Check if length exceeds limit
  if (noEmptyLinesText.length <= maxLength) {
    return noEmptyLinesText
  }

  // Find last word boundary
  let truncatedText = noEmptyLinesText.slice(0, maxLength)
  const lastSpaceIndex = truncatedText.lastIndexOf(' ')

  if (lastSpaceIndex !== -1) {
    truncatedText = truncatedText.slice(0, lastSpaceIndex)
  }

  // Truncate and append '...'
  return truncatedText + '...'
}
