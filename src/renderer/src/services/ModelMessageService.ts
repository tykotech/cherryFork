import { Model } from '@renderer/types'
import { ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletionMessageParam } from 'openai/resources'

export function processReqMessages(
  model: Model,
  reqMessages: ChatCompletionMessageParam[]
): ChatCompletionMessageParam[] {
  if (!needStrictlyInterleaveUserAndAssistantMessages(model)) {
    return reqMessages
  }

  return interleaveUserAndAssistantMessages(reqMessages)
}

function needStrictlyInterleaveUserAndAssistantMessages(model: Model) {
  return model.id === 'deepseek-reasoner'
}

function interleaveUserAndAssistantMessages(messages: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  if (!messages || messages.length === 0) {
    return []
  }

  const processedMessages: ChatCompletionMessageParam[] = []

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = { ...messages[i] }

    if (i > 0 && currentMessage.role === messages[i - 1].role) {
      // insert an empty message with the opposite role in between
      const emptyMessageRole = currentMessage.role === 'user' ? 'assistant' : 'user'
      processedMessages.push({
        role: emptyMessageRole,
        content: ''
      })
    }

    processedMessages.push(currentMessage)
  }

  return processedMessages
}

// Process postsuffix for Qwen3 model
export function processPostsuffixQwen3Model(
  // content type: string | ChatCompletionContentPart[] | null
  content: string | ChatCompletionContentPart[] | null,
  postsuffix: string,
  qwenThinkModeEnabled: boolean
): string | ChatCompletionContentPart[] | null {
  if (typeof content === 'string') {
    if (qwenThinkModeEnabled) {
      // Think mode enabled, remove postsuffix
      if (content.endsWith(postsuffix)) {
        return content.substring(0, content.length - postsuffix.length).trimEnd()
      }
    } else {
      // Think mode not enabled, add postsuffix
      if (!content.endsWith(postsuffix)) {
        return content + ' ' + postsuffix
      }
    }
  } else if (Array.isArray(content)) {
    let lastTextPartIndex = -1
    for (let i = content.length - 1; i >= 0; i--) {
      if (content[i].type === 'text') {
        lastTextPartIndex = i
        break
      }
    }

    if (lastTextPartIndex !== -1) {
      const textPart = content[lastTextPartIndex] as ChatCompletionContentPartText
      if (qwenThinkModeEnabled) {
        // Think mode enabled, remove postsuffix
        if (textPart.text.endsWith(postsuffix)) {
          textPart.text = textPart.text.substring(0, textPart.text.length - postsuffix.length).trimEnd()
          // Optional: If textPart.text becomes empty, consider removing this part
        }
      } else {
        // Think mode not enabled, add postsuffix
        if (!textPart.text.endsWith(postsuffix)) {
          textPart.text += postsuffix
        }
      }
    } else {
      // No text part in the array
      if (!qwenThinkModeEnabled) {
        // Think mode not enabled, need to add postsuffix
        // If there is no text part, add a new text part
        content.push({ type: 'text', text: postsuffix })
      }
    }
  } else {
    // currentContent is null
    if (!qwenThinkModeEnabled) {
      // Think mode not enabled, need to add postsuffix
      return content
    }
  }
  return content
}
