import Logger from '@renderer/config/logger'
import store from '@renderer/store'
import { LRUCache } from 'lru-cache'

/**
 * FNV-1a hash function for computing string hash.
 * @param input input string
 * @param maxInputLength maximum number of chars to hash, default 50000
 * @returns hash as base-36 string
 */
const fastHash = (input: string, maxInputLength: number = 50000) => {
  let hash = 2166136261 // FNV offset basis
  const count = Math.min(input.length, maxInputLength)
  for (let i = 0; i < count; i++) {
    hash ^= input.charCodeAt(i)
    hash *= 16777619 // FNV prime
    hash >>>= 0 // Ensure 32-bit unsigned integer
  }
  return hash.toString(36)
}

/**
 * Enhanced hash: sample three sections of long input to compute hash.
 * @param input input string
 * @returns hash or combined hash
 */
const enhancedHash = (input: string) => {
  const THRESHOLD = 50000

  if (input.length <= THRESHOLD) {
    return fastHash(input)
  }

  const mid = Math.floor(input.length / 2)

  // Three-section hash for uniqueness
  const frontSection = input.slice(0, 10000)
  const midSection = input.slice(mid - 15000, mid + 15000)
  const endSection = input.slice(-10000)

  return `${fastHash(frontSection)}-${fastHash(midSection)}-${fastHash(endSection)}`
}

// Highlight result cache instance
let highlightCache: LRUCache<string, string> | null = null

/**
 * Check if cache settings have changed.
 */
const haveSettingsChanged = (prev: any, current: any) => {
  if (!prev || !current) return true

  return (
    prev.codeCacheable !== current.codeCacheable ||
    prev.codeCacheMaxSize !== current.codeCacheMaxSize ||
    prev.codeCacheTTL !== current.codeCacheTTL ||
    prev.codeCacheThreshold !== current.codeCacheThreshold
  )
}

/**
 * Code cache service: manages syntax highlight caching and hash computing.
 */
export const CodeCacheService = {
  /**
   * Cache of last used configuration
   */
  _lastConfig: {
    codeCacheable: false,
    codeCacheMaxSize: 0,
    codeCacheTTL: 0,
    codeCacheThreshold: 0
  },

  /**
   * Get current cache configuration
   * @returns current configuration object
   */
  getConfig() {
    try {
      if (!store || !store.getState) return this._lastConfig

      const { codeCacheable, codeCacheMaxSize, codeCacheTTL, codeCacheThreshold } = store.getState().settings

      return { codeCacheable, codeCacheMaxSize, codeCacheTTL, codeCacheThreshold }
    } catch (error) {
      console.warn('[CodeCacheService] Failed to get config', error)
      return this._lastConfig
    }
  },

  /**
   * Ensure cache configuration is up to date.
   * Called before each cache operation.
   * @returns current cache instance or null
   */
  ensureCache() {
    const currentConfig = this.getConfig()

    // Check if configuration has changed
    if (haveSettingsChanged(this._lastConfig, currentConfig)) {
      this._lastConfig = currentConfig
      this._updateCacheInstance(currentConfig)
    }

    return highlightCache
  },

  /**
   * Update cache instance based on config.
   * @param config cache configuration
   */
  _updateCacheInstance(config: any) {
    try {
      const { codeCacheable, codeCacheMaxSize, codeCacheTTL } = config
      const newMaxSize = codeCacheMaxSize * 1000
      const newTTLMilliseconds = codeCacheTTL * 60 * 1000

      // Create or clear cache based on configuration
      if (codeCacheable) {
        if (!highlightCache) {
          // Cache doesn't exist, create new cache
          highlightCache = new LRUCache<string, string>({
            max: 200, // Maximum cache entries
            maxSize: newMaxSize, // Maximum cache size
            sizeCalculation: (value) => value.length, // Cache size calculation
            ttl: newTTLMilliseconds // Cache expiration time (milliseconds)
          })
          return
        }

        // Try to get configuration info from current cache
        const maxSize = highlightCache.max || 0
        const ttl = highlightCache.ttl || 0

        // Check if actual configuration has changed
        if (maxSize !== newMaxSize || ttl !== newTTLMilliseconds) {
          Logger.log('[CodeCacheService] Cache config changed, recreating cache')
          highlightCache.clear()
          highlightCache = new LRUCache<string, string>({
            max: 500,
            maxSize: newMaxSize,
            sizeCalculation: (value) => value.length,
            ttl: newTTLMilliseconds
          })
        }
      } else if (highlightCache) {
        // Caching disabled, release resources
        highlightCache.clear()
        highlightCache = null
      }
    } catch (error) {
      Logger.warn('[CodeCacheService] Failed to update cache config', error)
    }
  },

  /**
   * Generate cache key
   * @param code code content
   * @param language code language
   * @param theme highlight theme
   * @returns cache key
   */
  generateCacheKey: (code: string, language: string, theme: string) => {
    return `${language}|${theme}|${code.length}|${enhancedHash(code)}`
  },

  /**
   * Get cached highlight result
   * @param key cache key
   * @returns HTML string or null
   */
  getCachedResult: (key: string) => {
    try {
      // Ensure cache configuration is up to date
      CodeCacheService.ensureCache()

      if (!store || !store.getState) return null
      const { codeCacheable } = store.getState().settings
      if (!codeCacheable) return null

      return highlightCache?.get(key) || null
    } catch (error) {
      Logger.warn('[CodeCacheService] Failed to get cached result', error)
      return null
    }
  },

  /**
   * Set cache result
   * @param key cache key
   * @param html highlight HTML
   * @param codeLength length of code
   */
  setCachedResult: (key: string, html: string, codeLength: number) => {
    try {
      // Ensure cache configuration is up to date
      CodeCacheService.ensureCache()

      if (!store || !store.getState) return
      const { codeCacheable, codeCacheThreshold } = store.getState().settings

      // Check if caching is allowed
      if (!codeCacheable || codeLength < codeCacheThreshold * 1000) return

      highlightCache?.set(key, html)
    } catch (error) {
      Logger.warn('[CodeCacheService] Failed to set cached result', error)
    }
  },

  /**
   * Clear the cache
   */
  clear: () => {
    highlightCache?.clear()
  }
}
