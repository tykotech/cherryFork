import { WebSearchResultBlock } from '@anthropic-ai/sdk/resources'
import type { GroundingMetadata } from '@google/genai'
import { createEntityAdapter, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Citation } from '@renderer/pages/home/Messages/CitationsList'
import { WebSearchProviderResponse, WebSearchSource } from '@renderer/types'
import type { CitationMessageBlock, MessageBlock } from '@renderer/types/newMessage'
import { MessageBlockType } from '@renderer/types/newMessage'
import type OpenAI from 'openai'

import type { RootState } from './index' // Ensure RootState is exported from store/index.ts

// 1. Create Entity Adapter
// We use the block's `id` as the unique identifier.
const messageBlocksAdapter = createEntityAdapter<MessageBlock>()

// 2. Define Initial State using the adapter
// You can add other state properties alongside the normalized entities if needed.
const initialState = messageBlocksAdapter.getInitialState({
  loadingState: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
  error: null as string | null
})

// 3. Create Slice
const messageBlocksSlice = createSlice({
  name: 'messageBlocks',
  initialState,
  reducers: {
    // Use the adapter's reducer helpers for CRUD operations.
    // These reducers automatically handle the normalized state structure.

    /** Add or update a single block (Upsert). */
    upsertOneBlock: messageBlocksAdapter.upsertOne, // Expects MessageBlock as payload

    /** Add or update multiple blocks. Used for loading messages. */
    upsertManyBlocks: messageBlocksAdapter.upsertMany, // Expects MessageBlock[] as payload

    /** Remove a single block by ID. */
    removeOneBlock: messageBlocksAdapter.removeOne, // Expects EntityId (string) as payload

    /** Remove multiple blocks by a list of IDs. Used for cleaning up topics. */
    removeManyBlocks: messageBlocksAdapter.removeMany, // Expects EntityId[] (string[]) as payload

    /** Remove all blocks. Used for a full reset. */
    removeAllBlocks: messageBlocksAdapter.removeAll,

    // You can add custom reducers for other state properties (like loading/error)
    setMessageBlocksLoading: (state, action: PayloadAction<'idle' | 'loading'>) => {
      state.loadingState = action.payload
      state.error = null
    },
    setMessageBlocksError: (state, action: PayloadAction<string>) => {
      state.loadingState = 'failed'
      state.error = action.payload
    },
    // Note: If you only want to update an existing block, you can also use `updateOne`
    updateOneBlock: messageBlocksAdapter.updateOne // Expects { id: EntityId, changes: Partial<MessageBlock> }
  }
  // If you need to handle actions from other slices, you can add extraReducers here.
})

// 4. Export Actions and Reducer
export const {
  upsertOneBlock,
  upsertManyBlocks,
  removeOneBlock,
  removeManyBlocks,
  removeAllBlocks,
  setMessageBlocksLoading,
  setMessageBlocksError,
  updateOneBlock
} = messageBlocksSlice.actions

export const messageBlocksSelectors = messageBlocksAdapter.getSelectors<RootState>(
  (state) => state.messageBlocks // Ensure this matches the key in the root reducer
)

// --- Selector Integration --- START

// Selector to get the raw block entity by ID
const selectBlockEntityById = (state: RootState, blockId: string | undefined) =>
  blockId ? messageBlocksSelectors.selectById(state, blockId) : undefined // Use adapter selector

// --- Centralized Citation Formatting Logic ---
const formatCitationsFromBlock = (block: CitationMessageBlock | undefined): Citation[] => {
  if (!block) return []

  let formattedCitations: Citation[] = []
  // 1. Handle Web Search Responses
  if (block.response) {
    switch (block.response.source) {
      case WebSearchSource.GEMINI: {
        const groundingMetadata = block.response.results as GroundingMetadata
        formattedCitations =
          groundingMetadata?.groundingChunks?.map((chunk, index) => ({
            number: index + 1,
            url: chunk?.web?.uri || '',
            title: chunk?.web?.title,
            showFavicon: true,
            metadata: groundingMetadata.groundingSupports,
            type: 'websearch'
          })) || []
        break
      }
      case WebSearchSource.OPENAI_RESPONSE:
        formattedCitations =
          (block.response.results as OpenAI.Responses.ResponseOutputText.URLCitation[])?.map((result, index) => {
            let hostname: string | undefined
            try {
              hostname = result.title ? undefined : new URL(result.url).hostname
            } catch {
              hostname = result.url
            }
            return {
              number: index + 1,
              url: result.url,
              title: result.title,
              hostname: hostname,
              showFavicon: true,
              type: 'websearch'
            }
          }) || []
        break
      case WebSearchSource.OPENAI:
        formattedCitations =
          (block.response.results as OpenAI.Chat.Completions.ChatCompletionMessage.Annotation[])?.map((url, index) => {
            const urlCitation = url.url_citation
            let hostname: string | undefined
            try {
              hostname = urlCitation.title ? undefined : new URL(urlCitation.url).hostname
            } catch {
              hostname = urlCitation.url
            }
            return {
              number: index + 1,
              url: urlCitation.url,
              title: urlCitation.title,
              hostname: hostname,
              showFavicon: true,
              type: 'websearch'
            }
          }) || []
        break
      case WebSearchSource.ANTHROPIC:
        formattedCitations =
          (block.response.results as Array<WebSearchResultBlock>)?.map((result, index) => {
            const { url } = result
            let hostname: string | undefined
            try {
              hostname = new URL(url).hostname
            } catch {
              hostname = url
            }
            return {
              number: index + 1,
              url: url,
              title: result.title,
              hostname: hostname,
              showFavicon: true,
              type: 'websearch'
            }
          }) || []
        break
      case WebSearchSource.OPENROUTER:
      case WebSearchSource.PERPLEXITY:
        formattedCitations =
          (block.response.results as any[])?.map((url, index) => {
            try {
              const hostname = new URL(url).hostname
              return {
                number: index + 1,
                url,
                hostname,
                showFavicon: true,
                type: 'websearch'
              }
            } catch {
              return {
                number: index + 1,
                url,
                hostname: url,
                showFavicon: true,
                type: 'websearch'
              }
            }
          }) || []
        break
      case WebSearchSource.ZHIPU:
      case WebSearchSource.HUNYUAN:
        formattedCitations =
          (block.response.results as any[])?.map((result, index) => ({
            number: index + 1,
            url: result.link || result.url,
            title: result.title,
            showFavicon: true,
            type: 'websearch'
          })) || []
        break
      case WebSearchSource.WEBSEARCH:
        formattedCitations =
          (block.response.results as WebSearchProviderResponse)?.results?.map((result, index) => ({
            number: index + 1,
            url: result.url,
            title: result.title,
            content: result.content,
            showFavicon: true,
            type: 'websearch'
          })) || []
        break
    }
  }
  // 3. Handle Knowledge Base References
  if (block.knowledge && block.knowledge.length > 0) {
    formattedCitations.push(
      ...block.knowledge.map((result, index) => {
        const filePattern = /\[(.*?)]\(http:\/\/file\/(.*?)\)/
        const fileMatch = result.sourceUrl.match(filePattern)

        let url = result.sourceUrl
        let title = result.sourceUrl
        const showFavicon = true

        // If matches file link format [filename](http://file/xxx)
        if (fileMatch) {
          title = fileMatch[1]
          url = `http://file/${fileMatch[2]}`
        }

        return {
          number: index + 1,
          url: url,
          title: title,
          content: result.content,
          showFavicon: showFavicon,
          type: 'knowledge'
        }
      })
    )
  }
  // 4. Deduplicate by URL and Renumber Sequentially
  const urlSet = new Set<string>()
  return formattedCitations
    .filter((citation) => {
      if (!citation.url || urlSet.has(citation.url)) return false
      urlSet.add(citation.url)
      return true
    })
    .map((citation, index) => ({
      ...citation,
      number: index + 1
    }))
}
// --- End of Centralized Logic ---

// Memoized selector that takes a block ID and returns formatted citations
export const selectFormattedCitationsByBlockId = createSelector([selectBlockEntityById], (blockEntity): Citation[] => {
  if (blockEntity?.type === MessageBlockType.CITATION) {
    return formatCitationsFromBlock(blockEntity as CitationMessageBlock)
  }
  return []
})

// --- Selector Integration --- END

export default messageBlocksSlice.reducer
