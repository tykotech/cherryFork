import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { WebSearchProvider } from '@renderer/types'
export interface SubscribeSource {
  key: number
  url: string
  name: string
  blacklist?: string[] // Store the blacklist obtained from this subscription source
}

export interface WebSearchState {
  // Default search provider ID
  /** @deprecated Support for selecting search providers in the context menu, so this is no longer applicable */
  defaultProvider: string
  // List of all available search providers
  providers: WebSearchProvider[]
  // Whether to add the current date to the search query
  searchWithTime: boolean
  // Maximum number of search results
  maxResults: number
  // List of domains to exclude
  excludeDomains: string[]
  // List of subscription sources
  subscribeSources: SubscribeSource[]
  // Whether to overwrite provider search
  /** @deprecated Support for selecting search providers in the context menu, so this is no longer applicable */
  overwrite: boolean
  contentLimit?: number
  // Configuration for specific providers
  providerConfig: Record<string, any>
}

const initialState: WebSearchState = {
  defaultProvider: 'local-bing',
  providers: [
    {
      id: 'tavily',
      name: 'Tavily',
      apiHost: 'https://api.tavily.com',
      apiKey: ''
    },
    {
      id: 'searxng',
      name: 'Searxng',
      apiHost: '',
      basicAuthUsername: '',
      basicAuthPassword: ''
    },
    {
      id: 'exa',
      name: 'Exa',
      apiHost: 'https://api.exa.ai',
      apiKey: ''
    },
    {
      id: 'bocha',
      name: 'Bocha',
      apiHost: 'https://api.bochaai.com',
      apiKey: ''
    },
    {
      id: 'local-google',
      name: 'Google',
      url: 'https://www.google.com/search?q=%s'
    },
    {
      id: 'local-bing',
      name: 'Bing',
      url: 'https://cn.bing.com/search?q=%s&ensearch=1'
    },
    {
      id: 'local-baidu',
      name: 'Baidu',
      url: 'https://www.baidu.com/s?wd=%s'
    }
  ],
  searchWithTime: true,
  maxResults: 5,
  excludeDomains: [],
  subscribeSources: [],
  overwrite: false,
  providerConfig: {}
}

export const defaultWebSearchProviders = initialState.providers

const websearchSlice = createSlice({
  name: 'websearch',
  initialState,
  reducers: {
    setDefaultProvider: (state, action: PayloadAction<string>) => {
      state.defaultProvider = action.payload
    },
    setWebSearchProviders: (state, action: PayloadAction<WebSearchProvider[]>) => {
      state.providers = action.payload
    },
    updateWebSearchProviders: (state, action: PayloadAction<WebSearchProvider[]>) => {
      state.providers = action.payload
    },
    updateWebSearchProvider: (state, action: PayloadAction<WebSearchProvider>) => {
      const index = state.providers.findIndex((provider) => provider.id === action.payload.id)
      if (index !== -1) {
        state.providers[index] = action.payload
      }
    },
    setSearchWithTime: (state, action: PayloadAction<boolean>) => {
      state.searchWithTime = action.payload
    },
    setMaxResult: (state, action: PayloadAction<number>) => {
      state.maxResults = action.payload
    },
    setExcludeDomains: (state, action: PayloadAction<string[]>) => {
      state.excludeDomains = action.payload
    },
    // Add subscription source
    addSubscribeSource: (state, action: PayloadAction<Omit<SubscribeSource, 'key'>>) => {
      state.subscribeSources = state.subscribeSources || []
      const newKey =
        state.subscribeSources.length > 0 ? Math.max(...state.subscribeSources.map((item) => item.key)) + 1 : 0
      state.subscribeSources.push({
        key: newKey,
        url: action.payload.url,
        name: action.payload.name,
        blacklist: action.payload.blacklist
      })
    },
    // Remove subscription source
    removeSubscribeSource: (state, action: PayloadAction<number>) => {
      state.subscribeSources = state.subscribeSources.filter((source) => source.key !== action.payload)
    },
    // Update the blacklist of a subscription source
    updateSubscribeBlacklist: (state, action: PayloadAction<{ key: number; blacklist: string[] }>) => {
      const source = state.subscribeSources.find((s) => s.key === action.payload.key)
      if (source) {
        source.blacklist = action.payload.blacklist
      }
    },
    // Update the list of subscription sources
    setSubscribeSources: (state, action: PayloadAction<SubscribeSource[]>) => {
      state.subscribeSources = action.payload
    },
    setOverwrite: (state, action: PayloadAction<boolean>) => {
      state.overwrite = action.payload
    },
    addWebSearchProvider: (state, action: PayloadAction<WebSearchProvider>) => {
      // Check if provider with same ID already exists
      const exists = state.providers.some((provider) => provider.id === action.payload.id)

      if (!exists) {
        // Add the new provider to the array
        state.providers.push(action.payload)
      }
    },
    setContentLimit: (state, action: PayloadAction<number | undefined>) => {
      state.contentLimit = action.payload
    },
    setProviderConfig: (state, action: PayloadAction<Record<string, any>>) => {
      state.providerConfig = action.payload
    },
    updateProviderConfig: (state, action: PayloadAction<Record<string, any>>) => {
      state.providerConfig = { ...state.providerConfig, ...action.payload }
    }
  }
})

export const {
  setWebSearchProviders,
  updateWebSearchProvider,
  updateWebSearchProviders,
  setDefaultProvider,
  setSearchWithTime,
  setExcludeDomains,
  setMaxResult,
  addSubscribeSource,
  removeSubscribeSource,
  updateSubscribeBlacklist,
  setSubscribeSources,
  setOverwrite,
  addWebSearchProvider,
  setContentLimit,
  setProviderConfig,
  updateProviderConfig
} = websearchSlice.actions

export default websearchSlice.reducer
