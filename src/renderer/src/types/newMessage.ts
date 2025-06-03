import { CompletionUsage } from 'openai/resources'

import type {
  Assistant,
  FileType,
  GenerateImageResponse,
  KnowledgeReference,
  MCPServer,
  MCPToolResponse,
  Metrics,
  Model,
  Topic,
  Usage,
  WebSearchResponse,
  WebSearchSource
} from '.'

// MessageBlock type enum - optimized based on actual API return characteristics
export enum MessageBlockType {
  UNKNOWN = 'unknown', // Unknown type, used before returning
  MAIN_TEXT = 'main_text', // Main text content
  THINKING = 'thinking', // Thinking process (Claude, OpenAI-o series, etc.)
  TRANSLATION = 'translation', // Re-added
  IMAGE = 'image', // Image content
  CODE = 'code', // Code block
  TOOL = 'tool', // Added unified tool block type
  FILE = 'file', // File content
  ERROR = 'error', // Error message
  CITATION = 'citation' // Citation type (Now includes web search, grounding, etc.)
}

// Block status definition
export enum MessageBlockStatus {
  PENDING = 'pending', // Waiting to be processed
  PROCESSING = 'processing', // Processing, waiting to receive
  STREAMING = 'streaming', // Receiving stream
  SUCCESS = 'success', // Processed successfully
  ERROR = 'error', // Processing error
  PAUSED = 'paused' // Processing paused
}

// BaseMessageBlock base type - more concise, only includes necessary common properties
export interface BaseMessageBlock {
  id: string // Block ID
  messageId: string // Parent message ID
  type: MessageBlockType // Block type
  createdAt: string // Creation time
  updatedAt?: string // Update time
  status: MessageBlockStatus // Block status
  model?: Model // Model used
  metadata?: Record<string, any> // Common metadata
  error?: Record<string, any> // Added optional error field to base
}

export interface PlaceholderMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.UNKNOWN
}

// Main text block - core content
export interface MainTextMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.MAIN_TEXT
  content: string
  knowledgeBaseIds?: string[]
  // Citation references
  citationReferences?: {
    citationBlockId?: string
    citationBlockSource?: WebSearchSource
  }[]
}

// Thinking block - model reasoning process
export interface ThinkingMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.THINKING
  content: string
  thinking_millsec?: number
}

// Translation block
export interface TranslationMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.TRANSLATION
  content: string
  sourceBlockId?: string // Optional: ID of the block that was translated
  sourceLanguage?: string
  targetLanguage: string
}

// Code block - specifically handles code
export interface CodeMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.CODE
  content: string
  language: string // Code language
}

export interface ImageMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.IMAGE
  url?: string // For generated images or direct links
  file?: FileType // For user uploaded image files
  metadata?: BaseMessageBlock['metadata'] & {
    prompt?: string
    negativePrompt?: string
    generateImageResponse?: GenerateImageResponse
  }
}

// Added unified ToolBlock
export interface ToolMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.TOOL
  toolId: string
  toolName?: string
  arguments?: Record<string, any>
  content?: string | object
  metadata?: BaseMessageBlock['metadata'] & {
    rawMcpToolResponse?: MCPToolResponse
  }
}

// Consolidated and Enhanced Citation Block
export interface CitationMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.CITATION
  response?: WebSearchResponse
  knowledge?: KnowledgeReference[]
}

// File block
export interface FileMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.FILE
  file: FileType // File information
}
// Error block
export interface ErrorMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.ERROR
}

// MessageBlock union type
export type MessageBlock =
  | PlaceholderMessageBlock
  | MainTextMessageBlock
  | ThinkingMessageBlock
  | TranslationMessageBlock
  | CodeMessageBlock
  | ImageMessageBlock
  | ToolMessageBlock
  | FileMessageBlock
  | ErrorMessageBlock
  | CitationMessageBlock

export enum UserMessageStatus {
  SUCCESS = 'success'
}

export enum AssistantMessageStatus {
  PROCESSING = 'processing',
  PENDING = 'pending',
  SEARCHING = 'searching',
  SUCCESS = 'success',
  PAUSED = 'paused',
  ERROR = 'error'
}
// Message core type - includes metadata and block collection
export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  assistantId: string
  topicId: string
  createdAt: string
  updatedAt?: string
  status: UserMessageStatus | AssistantMessageStatus

  // Message metadata
  modelId?: string
  model?: Model
  type?: 'clear'
  isPreset?: boolean
  useful?: boolean
  askId?: string // Associated question message ID
  mentions?: Model[]
  enabledMCPs?: MCPServer[]

  usage?: Usage
  metrics?: Metrics

  // UI related
  multiModelMessageStyle?: 'horizontal' | 'vertical' | 'fold' | 'grid'
  foldSelected?: boolean

  // Block collection
  blocks: MessageBlock['id'][]
}

export interface Response {
  text?: string
  reasoning_content?: string
  usage?: Usage
  metrics?: Metrics
  webSearch?: WebSearchResponse
  mcpToolResponse?: MCPToolResponse[]
  generateImage?: GenerateImageResponse
  error?: ResponseError
}

export type ResponseError = Record<string, any>

export interface MessageInputBaseParams {
  assistant: Assistant
  topic: Topic
  content?: string
  files?: FileType[]
  knowledgeBaseIds?: string[]
  mentions?: Model[]
  enabledMCPs?: MCPServer[]
  usage?: CompletionUsage
}
