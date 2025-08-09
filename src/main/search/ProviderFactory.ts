import type { WebSearchProvider } from '@types'

import BaseSearchProvider from './BaseSearchProvider'
import ExaProvider from './ExaProvider'
import TavilyProvider from './TavilyProvider'

export function createSearchProvider(provider: WebSearchProvider): BaseSearchProvider {
  switch (provider.id) {
    case 'exa':
      return new ExaProvider(provider)
    case 'tavily':
      return new TavilyProvider(provider)
    default:
      throw new Error(`Unsupported provider: ${provider.id}`)
  }
}
