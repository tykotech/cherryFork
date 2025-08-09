import { TavilyClient } from '@agentic/tavily'
import type { WebSearchProvider, WebSearchProviderResponse } from '@types'

import BaseSearchProvider, { SearchOptions } from './BaseSearchProvider'

export default class TavilyProvider extends BaseSearchProvider {
  private tvly: TavilyClient

  constructor(provider: WebSearchProvider) {
    super(provider)
    if (!provider.apiKey) {
      throw new Error('API key is required for Tavily provider')
    }
    if (!provider.apiHost) {
      throw new Error('API host is required for Tavily provider')
    }
    this.tvly = new TavilyClient({ apiKey: provider.apiKey, apiBaseUrl: provider.apiHost })
  }

  protected async _search(query: string, options: SearchOptions): Promise<WebSearchProviderResponse> {
    const result = await this.tvly.search({
      query,
      max_results: Math.max(1, options.maxResults)
    })
    return {
      query: result.query,
      results: result.results.slice(0, options.maxResults).map((r) => {
        let content = r.content || ''
        if (options.contentLimit && content.length > options.contentLimit) {
          content = content.slice(0, options.contentLimit) + '...'
        }
        return {
          title: r.title || 'No title',
          content,
          url: r.url || ''
        }
      })
    }
  }
}
