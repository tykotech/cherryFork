import type { WebSearchProvider, WebSearchProviderResponse } from '@types'
import { LRUCache } from 'lru-cache'
import PQueue from 'p-queue'

export interface SearchOptions {
  maxResults: number
  contentLimit?: number
}

export default abstract class BaseSearchProvider {
  protected provider: WebSearchProvider
  private cache: LRUCache<string, WebSearchProviderResponse>
  private queue: PQueue

  constructor(provider: WebSearchProvider) {
    this.provider = provider
    this.cache = new LRUCache({ max: 100, ttl: 1000 * 60 * 5 })
    this.queue = new PQueue({
      interval: 60_000,
      intervalCap: 5,
      carryoverConcurrencyCount: true
    })
  }

  async search(query: string, options: SearchOptions): Promise<WebSearchProviderResponse> {
    const cacheKey = `${query}:${options.maxResults}:${options.contentLimit ?? ''}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    const result = (await this.queue.add(() => this._search(query, options))) as WebSearchProviderResponse
    this.cache.set(cacheKey, result)
    return result
  }

  protected abstract _search(query: string, options: SearchOptions): Promise<WebSearchProviderResponse>
}
