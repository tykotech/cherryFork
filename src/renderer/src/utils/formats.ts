import type { Message } from '@renderer/types/newMessage'

import { findImageBlocks, getMainTextContent } from './messageUtils/find'

/**
 * Clean up Markdown content
 * @param text The text to clean
 * @returns Cleaned text
 */
export function cleanMarkdownContent(text: string): string {
  if (!text) return ''
  let cleaned = text.replace(/!\[.*?]\(.*?\)/g, '') // Remove images
  cleaned = cleaned.replace(/\[(.*?)]\(.*?\)/g, '$1') // Replace links with plain text
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '') // Remove URLs
  cleaned = cleaned.replace(/[-—–_=+]{3,}/g, ' ') // Replace separators with space
  cleaned = cleaned.replace(/[￥$€£¥%@#&*^()[\]{}<>~`'"\\|/_.]+/g, '') // Remove special characters
  cleaned = cleaned.replace(/\s+/g, ' ').trim() // Normalize whitespace
  return cleaned
}

export function escapeDollarNumber(text: string) {
  let escapedText = ''

  for (let i = 0; i < text.length; i += 1) {
    let char = text[i]
    const nextChar = text[i + 1] || ' '

    if (char === '$' && nextChar >= '0' && nextChar <= '9') {
      char = '\\$'
    }

    escapedText += char
  }

  return escapedText
}

export function escapeBrackets(text: string) {
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\]|\\\((.*?)\\\)/g
  return text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
    if (codeBlock) {
      return codeBlock
    } else if (squareBracket) {
      return `
$$
${squareBracket}
$$
`
    } else if (roundBracket) {
      return `$${roundBracket}$`
    }
    return match
  })
}

export function extractTitle(html: string): string | null {
  // Handle standard closed title tags
  const titleRegex = /<title>(.*?)<\/title>/i
  const match = html.match(titleRegex)

  if (match) {
    return match[1] ? match[1].trim() : ''
  }

  // Handle unclosed title tags
  const malformedTitleRegex = /<title>(.*?)($|<(?!\/title))/i
  const malformedMatch = html.match(malformedTitleRegex)

  if (malformedMatch) {
    return malformedMatch[1] ? malformedMatch[1].trim() : ''
  }

  return null
}

export function removeSvgEmptyLines(text: string): string {
  // Use regex to match content inside <svg> tags
  const svgPattern = /(<svg[\s\S]*?<\/svg>)/g

  return text.replace(svgPattern, (svgMatch) => {
    // Split SVG content by line, filter out empty lines, then rejoin
    return svgMatch
      .split('\n')
      .filter((line) => line.trim() !== '')
      .join('\n')
  })
}

// export function withGeminiGrounding(block: MainTextMessageBlock | TranslationMessageBlock): string {
//   // TODO
//   // const citationBlock = findCitationBlockWithGrounding(block)
//   // const groundingSupports = citationBlock?.groundingMetadata?.groundingSupports

//   const content = block.content

//   // if (!groundingSupports || groundingSupports.length === 0) {
//   //   return content
//   // }

//   // groundingSupports.forEach((support) => {
//   //   const text = support?.segment?.text
//   //   const indices = support?.groundingChunkIndices

//   //   if (!text || !indices) return

//   //   const nodes = indices.reduce((acc, index) => {
//   //     acc.push(`<sup>${index + 1}</sup>`)
//   //     return acc
//   //   }, [] as string[])

//   //   content = content.replace(text, `${text} ${nodes.join(' ')}`)
//   // })

//   return content
// }

export function withGenerateImage(message: Message): { content: string; images?: string[] } {
  const originalContent = getMainTextContent(message)
  const imagePattern = new RegExp(`!\\[[^\\]]*\\]\\((.*?)\\s*("(?:.*[^"])")?\\s*\\)`)
  const images: string[] = []
  let processedContent: string

  processedContent = originalContent.replace(imagePattern, (_, url) => {
    if (url) {
      images.push(url)
    }
    return ''
  })

  processedContent = processedContent.replace(/\n\s*\n/g, '\n').trim()

  const downloadPattern = /\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g
  processedContent = processedContent
    .replace(downloadPattern, '')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  if (images.length > 0) {
    return { content: processedContent, images }
  }

  return { content: originalContent }
}

export function addImageFileToContents(messages: Message[]) {
  const lastAssistantMessage = messages.findLast((m) => m.role === 'assistant')
  if (!lastAssistantMessage) return messages
  const blocks = findImageBlocks(lastAssistantMessage)
  if (!blocks || blocks.length === 0) return messages
  if (blocks.every((v) => !v.metadata?.generateImage)) {
    return messages
  }

  const imageFiles = blocks.map((v) => v.metadata?.generateImage?.images).flat()
  const updatedAssistantMessage = {
    ...lastAssistantMessage,
    images: imageFiles
  }

  return messages.map((message) => (message.id === lastAssistantMessage.id ? updatedAssistantMessage : message))
}
