// A more thorough search method, recursively searches all child elements
export const findCitationInChildren = (children) => {
  if (!children) return null

  // Directly search child elements
  for (const child of Array.isArray(children) ? children : [children]) {
    if (typeof child === 'object' && child?.props?.['data-citation']) {
      return child.props['data-citation']
    }

    // Recursively search deeper levels
    if (typeof child === 'object' && child?.props?.children) {
      const found = findCitationInChildren(child.props.children)
      if (found) return found
    }
  }

  return null
}

/**
 * Convert math formula format:
 * - Convert LaTeX format '\\[' and '\\]' to '$$$$'.
 * - Convert LaTeX format '\\(' and '\\)' to '$$'.
 * @param input Input string
 * @returns string Converted string
 */
export function convertMathFormula(input) {
  if (!input) return input

  let result = input
  result = result.replaceAll('\\[', '$$$$').replaceAll('\\]', '$$$$')
  result = result.replaceAll('\\(', '$$').replaceAll('\\)', '$$')
  return result
}

/**
 * Remove two spaces at the end of each line in Markdown text.
 * @param markdown Input Markdown text
 * @returns string Processed text
 */
export function removeTrailingDoubleSpaces(markdown: string): string {
  // Use regular expression to match trailing two spaces and replace with empty string
  return markdown.replace(/ {2}$/gm, '')
}

/**
 * HTML entity encoding helper function
 * @param str Input string
 * @returns string Encoded string
 */
export const encodeHTML = (str: string) => {
  return str.replace(/[&<>"']/g, (match) => {
    const entities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }
    return entities[match]
  })
}
