import { ExternalToolResult, KnowledgeReference, MCPToolResponse, WebSearchResponse } from '.'
import { Response, ResponseError } from './newMessage'

// Define Enum for Chunk Types
// Currently used, does not list the complete lifecycle
export enum ChunkType {
  BLOCK_CREATED = 'block_created', // Message block created, meaningless
  BLOCK_IN_PROGRESS = 'block_in_progress', // Message block in progress, meaningless
  EXTERNEL_TOOL_IN_PROGRESS = 'externel_tool_in_progress', // External tool call in progress
  WEB_SEARCH_IN_PROGRESS = 'web_search_in_progress', // Internet search in progress
  WEB_SEARCH_COMPLETE = 'web_search_complete', // Internet search complete
  KNOWLEDGE_SEARCH_IN_PROGRESS = 'knowledge_search_in_progress', // Knowledge base search in progress
  KNOWLEDGE_SEARCH_COMPLETE = 'knowledge_search_complete', // Knowledge base search complete
  MCP_TOOL_IN_PROGRESS = 'mcp_tool_in_progress', // MCP tool call in progress
  MCP_TOOL_COMPLETE = 'mcp_tool_complete', // MCP tool call complete
  EXTERNEL_TOOL_COMPLETE = 'externel_tool_complete', // External tool call complete, external tools include internet search, knowledge base, MCP server
  LLM_RESPONSE_CREATED = 'llm_response_created', // Large model response created, returns the type of block to be created
  LLM_RESPONSE_IN_PROGRESS = 'llm_response_in_progress', // Large model response in progress
  TEXT_DELTA = 'text.delta', // Text content being generated
  TEXT_COMPLETE = 'text.complete', // Text content generation complete
  AUDIO_DELTA = 'audio.delta', // Audio content being generated
  AUDIO_COMPLETE = 'audio.complete', // Audio content generation complete
  IMAGE_CREATED = 'image.created', // Image content created
  IMAGE_DELTA = 'image.delta', // Image content being generated
  IMAGE_COMPLETE = 'image.complete', // Image content generation complete
  THINKING_DELTA = 'thinking.delta', // Thinking content being generated
  THINKING_COMPLETE = 'thinking.complete', // Thinking content generation complete
  LLM_WEB_SEARCH_IN_PROGRESS = 'llm_websearch_in_progress', // Large model internal search in progress, no obvious features
  LLM_WEB_SEARCH_COMPLETE = 'llm_websearch_complete', // Large model internal search complete
  LLM_RESPONSE_COMPLETE = 'llm_response_complete', // Large model response complete, used as a completion marker for streaming processing in the future
  BLOCK_COMPLETE = 'block_complete', // All blocks created complete, usually used for non-streaming processing; currently not distinguished
  ERROR = 'error', // Error
  SEARCH_IN_PROGRESS_UNION = 'search_in_progress_union', // Search (knowledge base/internet) in progress
  SEARCH_COMPLETE_UNION = 'search_complete_union' // Search (knowledge base/internet) complete
}

export interface LLMResponseCreatedChunk {
  /**
   * The response
   */
  response?: Response

  /**
   * The type of the chunk
   */
  type: ChunkType.LLM_RESPONSE_CREATED
}

export interface LLMResponseInProgressChunk {
  /**
   * The type of the chunk
   */
  response?: Response
  type: ChunkType.LLM_RESPONSE_IN_PROGRESS
}

export interface TextDeltaChunk {
  /**
   * The text content of the chunk
   */
  text: string

  /**
   * The ID of the chunk
   */
  chunk_id?: number

  /**
   * The type of the chunk
   */
  type: ChunkType.TEXT_DELTA
}

export interface TextCompleteChunk {
  /**
   * The text content of the chunk
   */
  text: string

  /**
   * The ID of the chunk
   */
  chunk_id?: number

  /**
   * The type of the chunk
   */
  type: ChunkType.TEXT_COMPLETE
}

export interface AudioDeltaChunk {
  /**
   * A chunk of Base64 encoded audio data
   */
  audio: string

  /**
   * The type of the chunk
   */
  type: ChunkType.AUDIO_DELTA
}

export interface AudioCompleteChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.AUDIO_COMPLETE
}

export interface ImageCreatedChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.IMAGE_CREATED
}

export interface ImageDeltaChunk {
  /**
   * A chunk of Base64 encoded image data
   */
  image: string

  /**
   * The type of the chunk
   */
  type: ChunkType.IMAGE_DELTA
}

export interface ImageCompleteChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.IMAGE_COMPLETE

  /**
   * The image content of the chunk
   */
  image: { type: 'base64'; images: string[] }
}

export interface ThinkingDeltaChunk {
  /**
   * The text content of the chunk
   */
  text: string

  /**
   * The thinking time of the chunk
   */
  thinking_millsec?: number

  /**
   * The type of the chunk
   */
  type: ChunkType.THINKING_DELTA
}

export interface ThinkingCompleteChunk {
  /**
   * The text content of the chunk
   */
  text: string

  /**
   * The thinking time of the chunk
   */
  thinking_millsec?: number

  /**
   * The type of the chunk
   */
  type: ChunkType.THINKING_COMPLETE
}

export interface WebSearchInProgressChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.WEB_SEARCH_IN_PROGRESS
}

export interface WebSearchCompleteChunk {
  /**
   * The web search response of the chunk
   */
  web_search: WebSearchResponse

  /**
   * The ID of the chunk
   */
  chunk_id?: number

  /**
   * The type of the chunk
   */
  type: ChunkType.WEB_SEARCH_COMPLETE
}

// Distinguish between internal and external search of the large model, as the timing is different
export interface LLMWebSearchInProgressChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.LLM_WEB_SEARCH_IN_PROGRESS
}

export interface LLMWebSearchCompleteChunk {
  /**
   * The LLM web search response of the chunk
   */
  llm_web_search: WebSearchResponse

  /**
   * The type of the chunk
   */
  type: ChunkType.LLM_WEB_SEARCH_COMPLETE
}

export interface KnowledgeSearchInProgressChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.KNOWLEDGE_SEARCH_IN_PROGRESS
}

export interface KnowledgeSearchCompleteChunk {
  /**
   * The knowledge search response of the chunk
   */
  knowledge: KnowledgeReference[]

  /**
   * The type of the chunk
   */
  type: ChunkType.KNOWLEDGE_SEARCH_COMPLETE
}

export interface ExternalToolInProgressChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.EXTERNEL_TOOL_IN_PROGRESS
}

export interface ExternalToolCompleteChunk {
  /**
   * The external tool result of the chunk
   */
  external_tool: ExternalToolResult
  /**
   * The type of the chunk
   */
  type: ChunkType.EXTERNEL_TOOL_COMPLETE
}

export interface MCPToolInProgressChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.MCP_TOOL_IN_PROGRESS
  /**
   * The tool responses of the chunk
   */
  responses: MCPToolResponse[]
}

export interface MCPToolCompleteChunk {
  /**
   * The tool response of the chunk
   */
  responses: MCPToolResponse[]

  /**
   * The type of the chunk
   */
  type: ChunkType.MCP_TOOL_COMPLETE
}

export interface LLMResponseCompleteChunk {
  /**
   * The response
   */
  response?: Response

  /**
   * The type of the chunk
   */
  type: ChunkType.LLM_RESPONSE_COMPLETE
}
export interface ErrorChunk {
  error: ResponseError

  type: ChunkType.ERROR
}

export interface BlockCreatedChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.BLOCK_CREATED
}

export interface BlockInProgressChunk {
  /**
   * The type of the chunk
   */
  type: ChunkType.BLOCK_IN_PROGRESS

  /**
   * The response
   */
  response?: Response
}

export interface BlockCompleteChunk {
  /**
   * The full response
   */
  response?: Response

  /**
   * The type of the chunk
   */
  type: ChunkType.BLOCK_COMPLETE

  /**
   * The error
   */
  error?: ResponseError
}

export interface SearchInProgressUnionChunk {
  type: ChunkType.SEARCH_IN_PROGRESS_UNION
}

export interface SearchCompleteUnionChunk {
  type: ChunkType.SEARCH_COMPLETE_UNION
}

export type Chunk =
  | BlockCreatedChunk // Message block created, meaningless
  | BlockInProgressChunk // Message block in progress, meaningless
  | ExternalToolInProgressChunk // External tool call in progress
  | WebSearchInProgressChunk // Internet search in progress
  | WebSearchCompleteChunk // Internet search complete
  | KnowledgeSearchInProgressChunk // Knowledge base search in progress
  | KnowledgeSearchCompleteChunk // Knowledge base search complete
  | MCPToolInProgressChunk // MCP tool call in progress
  | MCPToolCompleteChunk // MCP tool call complete
  | ExternalToolCompleteChunk // External tool call complete, external tools include internet search, knowledge base, MCP server
  | LLMResponseCreatedChunk // Large model response created, returns the type of block to be created
  | LLMResponseInProgressChunk // Large model response in progress
  | TextDeltaChunk // Text content being generated
  | TextCompleteChunk // Text content generation complete
  | AudioDeltaChunk // Audio content being generated
  | AudioCompleteChunk // Audio content generation complete
  | ImageCreatedChunk // Image content created
  | ImageDeltaChunk // Image content being generated
  | ImageCompleteChunk // Image content generation complete
  | ThinkingDeltaChunk // Thinking content being generated
  | ThinkingCompleteChunk // Thinking content generation complete
  | LLMWebSearchInProgressChunk // Large model internal search in progress, no obvious features
  | LLMWebSearchCompleteChunk // Large model internal search complete
  | LLMResponseCompleteChunk // Large model response complete, used as a completion marker for streaming processing in the future
  | BlockCompleteChunk // All blocks created complete, usually used for non-streaming processing; currently not distinguished
  | ErrorChunk // Error
  | SearchInProgressUnionChunk // Search (knowledge base/internet) in progress
  | SearchCompleteUnionChunk // Search (knowledge base/internet) complete
