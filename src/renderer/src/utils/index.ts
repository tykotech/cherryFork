import Logger from '@renderer/config/logger'
import { Model } from '@renderer/types'
import { ModalFuncProps } from 'antd/es/modal/interface'
// @ts-ignore next-line`
import { v4 as uuidv4 } from 'uuid'

/**
 * Asynchronously execute a function.
 * @param fn The function to execute
 * @returns Promise<void> The result of execution
 */
export const runAsyncFunction = async (fn: () => void) => {
  await fn()
}

/**
 * Create a delayed Promise that resolves after a specified number of seconds.
 * @param seconds Number of seconds to delay
 * @returns Promise<any> A Promise that resolves after the specified seconds
 */
export const delay = (seconds: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, seconds * 1000)
  })
}

/**
 * Wait until fn returns true
 **/
export const waitAsyncFunction = (fn: () => Promise<any>, interval = 200, stopTimeout = 60000) => {
  let timeout = false
  const timer = setTimeout(() => (timeout = true), stopTimeout)

  return (async function check(): Promise<any> {
    if (await fn()) {
      clearTimeout(timer)
      return Promise.resolve()
    } else if (!timeout) {
      return delay(interval / 1000).then(check)
    } else {
      return Promise.resolve()
    }
  })()
}

export const uuid = () => uuidv4()

export function isFreeModel(model: Model) {
  return (model.id + model.name).toLocaleLowerCase().includes('free')
}

export async function isProduction() {
  const { isPackaged } = await window.api.getAppInfo()
  return isPackaged
}

export async function isDev() {
  const isProd = await isProduction()
  return !isProd
}

/**
 * Extract error message from an error object.
 * @param error Error object or string
 * @returns string The extracted error message, or an empty string if none
 */
export function getErrorMessage(error: any) {
  if (!error) {
    return ''
  }

  if (typeof error === 'string') {
    return error
  }

  if (error?.error) {
    return getErrorMessage(error.error)
  }

  if (error?.message) {
    return error.message
  }

  return ''
}

export function removeQuotes(str) {
  return str.replace(/['"]+/g, '')
}

export function removeSpecialCharacters(str: string) {
  // First remove newlines and quotes, then remove other special characters
  return str.replace(/[\n"]/g, '').replace(/[\p{M}\p{P}]/gu, '')
}

/**
 * Check if the proxy url is valid
 * @param url Proxy url
 * @returns boolean
 */
export const isValidProxyUrl = (url: string) => {
  return url.includes('://')
}

/**
 * Dynamically load a JavaScript script.
 * @param url The URL of the script
 * @returns Promise<void> A Promise that resolves or rejects when the script loads or fails
 */
export function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = url

    script.onload = resolve
    script.onerror = reject

    document.head.appendChild(script)
  })
}

/**
 * Check if a URL contains a path part.
 * @param url Input URL string
 * @returns boolean Returns true if the URL contains a path, otherwise false
 */
export function hasPath(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.pathname !== '/' && parsedUrl.pathname !== ''
  } catch (error) {
    console.error('Invalid URL:', error)
    return false
  }
}

/**
 * Compare two version strings.
 * @param v1 First version string
 * @param v2 Second version string
 * @returns number Comparison result: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareVersions = (v1: string, v2: string): number => {
  const v1Parts = v1.split('.').map(Number)
  const v2Parts = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  return 0
}

/**
 * Show a confirmation modal dialog.
 * @param params Modal dialog parameters
 * @returns Promise<boolean> Returns true if user confirms, false if cancels
 */
export function modalConfirm(params: ModalFuncProps) {
  return new Promise((resolve) => {
    window.modal.confirm({
      centered: true,
      ...params,
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
}

/**
 * Check if an object contains a specific key.
 * @param obj Input object
 * @param key Key to check
 * @returns boolean Returns true if the key exists, otherwise false
 */
export function hasObjectKey(obj: any, key: string) {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  return Object.keys(obj).includes(key)
}

/**
 * Extract npx mcp config from npm readme.
 * @param readme Readme string
 * @returns mcp config sample
 */
export function getMcpConfigSampleFromReadme(readme: string) {
  if (readme) {
    try {
      const regex = /"mcpServers"\s*:\s*({(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*})/g
      for (const match of readme.matchAll(regex)) {
        let orgSample = JSON.parse(match[1])
        orgSample = orgSample[Object.keys(orgSample)[0] ?? '']
        if (orgSample.command === 'npx') {
          return orgSample
        }
      }
    } catch (e) {
      Logger.log('getMcpConfigSampleFromReadme', e)
    }
  }
  return null
}

export * from './file'
export * from './image'
export * from './json'
export * from './naming'
export * from './sort'
export * from './style'
