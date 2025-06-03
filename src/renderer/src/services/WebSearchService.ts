import Logger from '@renderer/config/logger'
import WebSearchEngineProvider from '@renderer/providers/WebSearchProvider'
import store from '@renderer/store'
import { WebSearchState } from '@renderer/store/websearch'
import { WebSearchProvider, WebSearchProviderResponse } from '@renderer/types'
import { hasObjectKey } from '@renderer/utils'
import { addAbortController } from '@renderer/utils/abortController'
import { ExtractResults } from '@renderer/utils/extract'
import { fetchWebContents } from '@renderer/utils/fetch'
import dayjs from 'dayjs'
/**
 * Service class providing web search related functions
 */
class WebSearchService {
  /**
   * Whether it is paused
   */
  private signal: AbortSignal | null = null

  isPaused = false

  createAbortSignal(key: string) {
    const controller = new AbortController()
    this.signal = controller.signal
    addAbortController(key, () => {
      this.isPaused = true
      this.signal = null
      controller.abort()
    })
    return controller
  }

  /**
   * Get the current stored web search state
   * @private
   * @returns Web search state
   */
  private getWebSearchState(): WebSearchState {
    return store.getState().websearch
  }

  /**
   * Check if web search is enabled
   * @public
   * @returns Returns true if the default search provider is enabled, otherwise false
   */
  public isWebSearchEnabled(providerId?: WebSearchProvider['id']): boolean {
    const { providers } = this.getWebSearchState()
    const provider = providers.find((provider) => provider.id === providerId)

    if (!provider) {
      return false
    }

    if (provider.id.startsWith('local-')) {
      return true
    }

    if (hasObjectKey(provider, 'apiKey')) {
      return provider.apiKey !== ''
    }

    if (hasObjectKey(provider, 'apiHost')) {
      return provider.apiHost !== ''
    }

    return false
  }

  /**
   * @deprecated Support for selecting search providers in the context menu, so this is no longer applicable
   *
   * Check if overwrite search is enabled
   * @public
   * @returns Returns true if overwrite search is enabled, otherwise false
   */
  public isOverwriteEnabled(): boolean {
    const { overwrite } = this.getWebSearchState()
    return overwrite
  }

  /**
   * Get the current default web search provider
   * @public
   * @returns Web search provider
   */
  public getWebSearchProvider(providerId?: string): WebSearchProvider | undefined {
    const { providers } = this.getWebSearchState()
    const provider = providers.find((provider) => provider.id === providerId)

    return provider
  }

  /**
   * Perform web search using the specified provider
   * @public
   * @param provider Search provider
   * @param query Search query
   * @returns Search response
   */
  public async search(
    provider: WebSearchProvider,
    query: string,
    httpOptions?: RequestInit
  ): Promise<WebSearchProviderResponse> {
    const websearch = this.getWebSearchState()
    const webSearchEngine = new WebSearchEngineProvider(provider)

    let formattedQuery = query
    // FIXME: To be discussed, effect is average
    if (websearch.searchWithTime) {
      formattedQuery = `today is ${dayjs().format('YYYY-MM-DD')} \r\n ${query}`
    }

    // try {
    return await webSearchEngine.search(formattedQuery, websearch, httpOptions)
    // } catch (error) {
    //   console.error('Search failed:', error)
    //   throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    // }
  }

  /**
   * Check if the search provider is working properly
   * @public
   * @param provider The search provider to check
   * @returns Returns true if the provider is available, otherwise false
   */
  public async checkSearch(provider: WebSearchProvider): Promise<{ valid: boolean; error?: any }> {
    try {
      const response = await this.search(provider, 'test query')
      Logger.log('[checkSearch] Search response:', response)
      // Optimized judgment condition: check if the result is valid and there is no error
      return { valid: response.results !== undefined, error: undefined }
    } catch (error) {
      return { valid: false, error }
    }
  }

  public async processWebsearch(
    webSearchProvider: WebSearchProvider,
    extractResults: ExtractResults
  ): Promise<WebSearchProviderResponse> {
    // Check if websearch and question are valid
    if (!extractResults.websearch?.question || extractResults.websearch.question.length === 0) {
      Logger.log('[processWebsearch] No valid question found in extractResults.websearch')
      return { results: [] }
    }

    const questions = extractResults.websearch.question
    const links = extractResults.websearch.links
    const firstQuestion = questions[0]
    if (firstQuestion === 'summarize' && links && links.length > 0) {
      const contents = await fetchWebContents(links, undefined, undefined, {
        signal: this.signal
      })
      return {
        query: 'summaries',
        results: contents
      }
    }
    const searchPromises = questions.map((q) => this.search(webSearchProvider, q, { signal: this.signal }))
    const searchResults = await Promise.allSettled(searchPromises)
    const aggregatedResults: any[] = []

    searchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.results) {
          aggregatedResults.push(...result.value.results)
        }
      }
      if (result.status === 'rejected') {
        throw result.reason
      }
    })
    return {
      query: questions.join(' | '),
      results: aggregatedResults
    }
  }
}

export default new WebSearchService()
