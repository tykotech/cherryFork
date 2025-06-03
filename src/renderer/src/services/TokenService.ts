import { Assistant, FileType, FileTypes, Usage } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import { findFileBlocks, getMainTextContent, getThinkingContent } from '@renderer/utils/messageUtils/find'
import { flatten, takeRight } from 'lodash'
import { approximateTokenSize } from 'tokenx'

import { getAssistantSettings } from './AssistantService'
import { filterContextMessages, filterMessages } from './MessagesService'

interface MessageItem {
  name?: string
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function getFileContent(file: FileType) {
  if (!file) {
    return ''
  }

  if (file.type === FileTypes.TEXT) {
    return await window.api.file.read(file.id + file.ext)
  }

  return ''
}

async function getMessageParam(message: Message): Promise<MessageItem[]> {
  const param: MessageItem[] = []

  const content = getMainTextContent(message)
  const files = findFileBlocks(message)

  param.push({
    role: message.role,
    content
  })

  if (files.length > 0) {
    for (const file of files) {
      param.push({
        role: 'assistant',
        content: await getFileContent(file.file)
      })
    }
  }

  return param
}

export function estimateTextTokens(text: string) {
  return approximateTokenSize(text)
}

export function estimateImageTokens(file: FileType) {
  return Math.floor(file.size / 100)
}

/**
 * Estimate the token usage for user input (text and files).
 *
 * This function only estimates based on the provided content (text) and files (file list),
 * does not depend on the complete Message structure, and does not process message blocks, context, etc.
 *
 * @param {Object} params - Input parameter object
 * @param {string} [params.content] - User input text content
 * @param {FileType[]} [params.files] - List of files uploaded by the user (supports images and text)
 * @returns {Promise<Usage>} Returns a Usage object containing prompt_tokens, completion_tokens, total_tokens
 */
export async function estimateUserPromptUsage({
  content,
  files
}: {
  content?: string
  files?: FileType[]
}): Promise<Usage> {
  let imageTokens = 0

  if (files && files.length > 0) {
    const images = files.filter((f) => f.type === FileTypes.IMAGE)
    if (images.length > 0) {
      for (const image of images) {
        imageTokens = estimateImageTokens(image) + imageTokens
      }
    }
  }

  const tokens = estimateTextTokens(content || '')

  return {
    prompt_tokens: tokens,
    completion_tokens: tokens,
    total_tokens: tokens + (imageTokens ? imageTokens - 7 : 0)
  }
}

/**
 * Estimate the token usage for a complete message (Message).
 *
 * This function automatically extracts the main text content, reasoning content, and all file blocks from the message,
 * counts the number of tokens for text and images, suitable for usage estimation of a complete message object.
 *
 * @param {Partial<Message>} message - Message object, can be a complete or partial Message
 * @returns {Promise<Usage>} Returns a Usage object containing prompt_tokens, completion_tokens, total_tokens
 */
export async function estimateMessageUsage(message: Partial<Message>): Promise<Usage> {
  const fileBlocks = findFileBlocks(message as Message)
  const files = fileBlocks.map((f) => f.file)

  let imageTokens = 0

  if (files.length > 0) {
    const images = files.filter((f) => f.type === FileTypes.IMAGE)
    if (images.length > 0) {
      for (const image of images) {
        imageTokens = estimateImageTokens(image) + imageTokens
      }
    }
  }

  const content = getMainTextContent(message as Message)
  const reasoningContent = getThinkingContent(message as Message)
  const combinedContent = [content, reasoningContent].filter((s) => s !== undefined).join(' ')
  const tokens = estimateTextTokens(combinedContent)

  return {
    prompt_tokens: tokens,
    completion_tokens: tokens,
    total_tokens: tokens + (imageTokens ? imageTokens - 7 : 0)
  }
}

export async function estimateMessagesUsage({
  assistant,
  messages
}: {
  assistant: Assistant
  messages: Message[]
}): Promise<Usage> {
  const outputMessage = messages.pop()!

  const prompt_tokens = await estimateHistoryTokens(assistant, messages)
  const { completion_tokens } = await estimateMessageUsage(outputMessage)

  return {
    prompt_tokens,
    completion_tokens,
    total_tokens: prompt_tokens + completion_tokens
  } as Usage
}

export async function estimateHistoryTokens(assistant: Assistant, msgs: Message[]) {
  const { contextCount } = getAssistantSettings(assistant)
  const maxContextCount = contextCount
  const messages = filterMessages(filterContextMessages(takeRight(msgs, maxContextCount)))

  // Messages with usage data, quickly calculate the total
  const uasageTokens = messages
    .filter((m) => m.usage)
    .reduce((acc, message) => {
      const inputTokens = message.usage?.total_tokens ?? 0
      const outputTokens = message.usage!.completion_tokens ?? 0
      return acc + (message.role === 'user' ? inputTokens : outputTokens)
    }, 0)

  // Messages without usage data, need to calculate the token for each message
  let allMessages: MessageItem[][] = []

  for (const message of messages.filter((m) => !m.usage)) {
    const items = await getMessageParam(message)
    allMessages = allMessages.concat(items)
  }

  const prompt = assistant.prompt
  const input = flatten(allMessages)
    .map((m) => m.content)
    .join('\n')

  return estimateTextTokens(prompt + input) + uasageTokens
}
