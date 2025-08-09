import { ExaClient } from '@agentic/exa'
import type { WebSearchProvider, WebSearchProviderResponse } from '@types'

import BaseSearchProvider, { SearchOptions } from './BaseSearchProvider'

export default class ExaProvider extends BaseSearchProvider {
  private exa: ExaClient

  constructor(provider: WebSearchProvider) {
    super(provider)
    if (!provider.apiKey) {
      throw new Error('API key is required for Exa provider')
    }
    if (!provider.apiHost) {
      throw new Error('API host is required for Exa provider')
    }
    this.exa = new ExaClient({ apiKey: provider.apiKey, apiBaseUrl: provider.apiHost })
  }

  protected async _search(query: string, options: SearchOptions): Promise<WebSearchProviderResponse> {
    const response = await this.exa.search({
      query,
      numResults: Math.max(1, options.maxResults),
      contents: {
        text: true
      }
    })

    return {
      query: response.autopromptString,
      results: response.results.slice(0, options.maxResults).map((result) => {
        let content = result.text || ''
        if (options.contentLimit && content.length > options.contentLimit) {
          content = content.slice(0, options.contentLimit) + '...'
        }
        return {
          title: result.title || 'No title',
          content,
          url: result.url || ''
        }
      })
    }
  }
}
