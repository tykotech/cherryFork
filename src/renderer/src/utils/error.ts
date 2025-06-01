export function getErrorDetails(err: any, seen = new WeakSet()): any {
  // Handle circular references
  if (err === null || typeof err !== 'object' || seen.has(err)) {
    return err
  }

  seen.add(err)
  const result: any = {}

  // Get all enumerable properties, including those from the prototype chain
  const allProps = new Set([...Object.getOwnPropertyNames(err), ...Object.keys(err)])

  for (const prop of allProps) {
    try {
      const value = err[prop]
      // Skip function properties
      if (typeof value === 'function') continue
      // Recursively process nested objects
      result[prop] = getErrorDetails(value, seen)
    } catch (e) {
      result[prop] = '<Unable to access property>'
    }
  }

  return result
}

export function formatErrorMessage(error: any): string {
  console.error('Original error:', error)

  try {
    const detailedError = getErrorDetails(error)
    delete detailedError?.headers
    delete detailedError?.stack
    delete detailedError?.request_id
    return '```json\n' + JSON.stringify(detailedError, null, 2) + '\n```'
  } catch (e) {
    try {
      return '```\n' + String(error) + '\n```'
    } catch {
      return 'Error: Unable to format error message'
    }
  }
}

export function formatMessageError(error: any): Record<string, any> {
  try {
    const detailedError = getErrorDetails(error)
    delete detailedError?.headers
    delete detailedError?.stack
    delete detailedError?.request_id
    return detailedError
  } catch (e) {
    try {
      return { message: String(error) }
    } catch {
      return { message: 'Error: Unable to format error message' }
    }
  }
}

export function getErrorMessage(error: any): string {
  return error?.message || error?.toString() || ''
}

export const isAbortError = (error: any): boolean => {
  // Check error message
  if (error?.message === 'Request was aborted.') {
    return true
  }

  // Check if it's a DOMException abort error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }

  // Check for OpenAI specific error structure
  if (
    error &&
    typeof error === 'object' &&
    (error.message === 'Request was aborted.' || error?.message?.includes('signal is aborted without reason'))
  ) {
    return true
  }

  return false
}
