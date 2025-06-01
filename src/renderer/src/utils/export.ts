import { Client } from '@notionhq/client'
import { isMac, isWindows } from '@renderer/config/constant'
import db from '@renderer/databases'
import i18n from '@renderer/i18n'
import { getMessageTitle } from '@renderer/services/MessagesService'
import store from '@renderer/store'
import { setExportState } from '@renderer/store/runtime'
import type { Topic } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import { removeSpecialCharactersForFileName } from '@renderer/utils/file'
import { convertMathFormula } from '@renderer/utils/markdown'
import { getMainTextContent, getThinkingContent } from '@renderer/utils/messageUtils/find'
import { markdownToBlocks } from '@tryfabric/martian'
import dayjs from 'dayjs'
// TODO: Add support for thinking content

/**
 * Extracts a title from message content, limiting length and handling line breaks and punctuation. Used for export functionality.
 * @param str Input string
 * @param length Maximum title length, defaults to 80
 * @returns string Extracted title
 */
export function getTitleFromString(str: string, length: number = 80) {
  let title = str.trimStart().split('\n')[0]

  if (title.includes('。')) {
    title = title.split('。')[0]
  } else if (title.includes('，')) {
    title = title.split('，')[0]
  } else if (title.includes('.')) {
    title = title.split('.')[0]
  } else if (title.includes(',')) {
    title = title.split(',')[0]
  }

  if (title.length > length) {
    title = title.slice(0, length)
  }

  if (!title) {
    title = str.slice(0, length)
  }

  return title
}

export const messageToMarkdown = (message: Message) => {
  const { forceDollarMathInMarkdown } = store.getState().settings
  const roleText = message.role === 'user' ? '🧑‍💻 User' : '🤖 Assistant'
  const titleSection = `### ${roleText}`
  const content = getMainTextContent(message)
  const contentSection = forceDollarMathInMarkdown ? convertMathFormula(content) : content

  return [titleSection, '', contentSection].join('\n')
}

// Keep the interface for use by other export methods
export const messageToMarkdownWithReasoning = (message: Message) => {
  const { forceDollarMathInMarkdown } = store.getState().settings
  const roleText = message.role === 'user' ? '🧑‍💻 User' : '🤖 Assistant'
  const titleSection = `### ${roleText}`
  let reasoningContent = getThinkingContent(message)
  // Process thinking content
  let reasoningSection = ''
  if (reasoningContent) {
    // Remove the opening <think> tag and newlines, and replace all newlines with <br>
    if (reasoningContent.startsWith('<think>\n')) {
      reasoningContent = reasoningContent.substring(8)
    } else if (reasoningContent.startsWith('<think>')) {
      reasoningContent = reasoningContent.substring(7)
    }
    reasoningContent = reasoningContent.replace(/\n/g, '<br>')

    // Apply math formula conversion (if enabled)
    if (forceDollarMathInMarkdown) {
      reasoningContent = convertMathFormula(reasoningContent)
    }
    // Add Markdown formatting for thinking content
    reasoningSection = `<details style="background-color: #f5f5f5; padding: 5px; border-radius: 10px; margin-bottom: 10px;">
      <summary>${i18n.t('common.reasoning_content')}</summary><hr>
    ${reasoningContent}
</details>`
  }
  const content = getMainTextContent(message)

  const contentSection = forceDollarMathInMarkdown ? convertMathFormula(content) : content

  return [titleSection, '', reasoningSection + contentSection].join('\n')
}

export const messagesToMarkdown = (messages: Message[], exportReasoning?: boolean) => {
  return messages
    .map((message) => (exportReasoning ? messageToMarkdownWithReasoning(message) : messageToMarkdown(message)))
    .join('\n\n---\n\n')
}

export const topicToMarkdown = async (topic: Topic, exportReasoning?: boolean) => {
  const topicName = `# ${topic.name}`
  const topicMessages = await db.topics.get(topic.id)

  if (topicMessages) {
    return topicName + '\n\n' + messagesToMarkdown(topicMessages.messages, exportReasoning)
  }

  return ''
}

export const exportTopicAsMarkdown = async (topic: Topic, exportReasoning?: boolean) => {
  const { markdownExportPath } = store.getState().settings
  if (!markdownExportPath) {
    try {
      const fileName = removeSpecialCharactersForFileName(topic.name) + '.md'
      const markdown = await topicToMarkdown(topic, exportReasoning)
      const result = await window.api.file.save(fileName, markdown)
      if (result) {
        window.message.success({
          content: i18n.t('message.success.markdown.export.specified'),
          key: 'markdown-success'
        })
      }
    } catch (error: any) {
      window.message.error({ content: i18n.t('message.error.markdown.export.specified'), key: 'markdown-error' })
    }
  } else {
    try {
      const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
      const fileName = removeSpecialCharactersForFileName(topic.name) + ` ${timestamp}.md`
      const markdown = await topicToMarkdown(topic, exportReasoning)
      await window.api.file.write(markdownExportPath + '/' + fileName, markdown)
      window.message.success({ content: i18n.t('message.success.markdown.export.preconf'), key: 'markdown-success' })
    } catch (error: any) {
      window.message.error({ content: i18n.t('message.error.markdown.export.preconf'), key: 'markdown-error' })
    }
  }
}

export const exportMessageAsMarkdown = async (message: Message, exportReasoning?: boolean) => {
  const { markdownExportPath } = store.getState().settings
  if (!markdownExportPath) {
    try {
      const title = await getMessageTitle(message)
      const fileName = removeSpecialCharactersForFileName(title) + '.md'
      const markdown = exportReasoning ? messageToMarkdownWithReasoning(message) : messageToMarkdown(message)
      const result = await window.api.file.save(fileName, markdown)
      if (result) {
        window.message.success({
          content: i18n.t('message.success.markdown.export.specified'),
          key: 'markdown-success'
        })
      }
    } catch (error: any) {
      window.message.error({ content: i18n.t('message.error.markdown.export.specified'), key: 'markdown-error' })
    }
  } else {
    try {
      const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
      const title = await getMessageTitle(message)
      const fileName = removeSpecialCharactersForFileName(title) + ` ${timestamp}.md`
      const markdown = exportReasoning ? messageToMarkdownWithReasoning(message) : messageToMarkdown(message)
      await window.api.file.write(markdownExportPath + '/' + fileName, markdown)
      window.message.success({ content: i18n.t('message.success.markdown.export.preconf'), key: 'markdown-success' })
    } catch (error: any) {
      window.message.error({ content: i18n.t('message.error.markdown.export.preconf'), key: 'markdown-error' })
    }
  }
}

const convertMarkdownToNotionBlocks = async (markdown: string) => {
  return markdownToBlocks(markdown)
}
// Modified splitNotionBlocks function
const splitNotionBlocks = (blocks: any[]) => {
  const { notionAutoSplit, notionSplitSize } = store.getState().settings

  // 如果未开启自动分页,返回单页
  if (!notionAutoSplit) {
    return [blocks]
  }

  const pages: any[][] = []
  let currentPage: any[] = []

  blocks.forEach((block) => {
    if (currentPage.length >= notionSplitSize) {
      window.message.info({ content: i18n.t('message.info.notion.block_reach_limit'), key: 'notion-block-reach-limit' })
      pages.push(currentPage)
      currentPage = []
    }
    currentPage.push(block)
  })

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages
}

export const exportTopicToNotion = async (topic: Topic) => {
  const { isExporting } = store.getState().runtime.export
  if (isExporting) {
    window.message.warning({ content: i18n.t('message.warn.notion.exporting'), key: 'notion-exporting' })
    return
  }
  setExportState({
    isExporting: true
  })
  const { notionDatabaseID, notionApiKey } = store.getState().settings
  if (!notionApiKey || !notionDatabaseID) {
    window.message.error({ content: i18n.t('message.error.notion.no_api_key'), key: 'notion-no-apikey-error' })
    return
  }

  try {
    const notion = new Client({ auth: notionApiKey })
    const markdown = await topicToMarkdown(topic)
    const allBlocks = await convertMarkdownToNotionBlocks(markdown)
    const blockPages = splitNotionBlocks(allBlocks)

    if (blockPages.length === 0) {
      throw new Error('No content to export')
    }

    // Create main page and sub-pages
    let mainPageResponse: any = null
    let parentBlockId: string | null = null
    for (let i = 0; i < blockPages.length; i++) {
      const pageTitle = topic.name
      const pageBlocks = blockPages[i]

      // Export progress prompt
      window.message.loading({
        content: i18n.t('message.loading.notion.exporting_progress', {
          current: i + 1,
          total: blockPages.length
        }),
        key: 'notion-export-progress'
      })

      if (i === 0) {
        const response = await notion.pages.create({
          parent: { database_id: notionDatabaseID },
          properties: {
            [store.getState().settings.notionPageNameKey || 'Name']: {
              title: [{ text: { content: pageTitle } }]
            }
          },
          children: pageBlocks
        })
        mainPageResponse = response
        parentBlockId = response.id
      } else {
        if (!parentBlockId) {
          throw new Error('Parent block ID is null')
        }
        await notion.blocks.children.append({
          block_id: parentBlockId,
          children: pageBlocks
        })
      }
    }

    window.message.success({ content: i18n.t('message.success.notion.export'), key: 'notion-export-progress' })
    return mainPageResponse
  } catch (error: any) {
    window.message.error({ content: i18n.t('message.error.notion.export'), key: 'notion-export-progress' })
    return null
  } finally {
    setExportState({
      isExporting: false
    })
  }
}

export const exportMarkdownToNotion = async (title: string, content: string) => {
  const { isExporting } = store.getState().runtime.export

  if (isExporting) {
    window.message.warning({ content: i18n.t('message.warn.notion.exporting'), key: 'notion-exporting' })
    return
  }

  setExportState({ isExporting: true })

  const { notionDatabaseID, notionApiKey } = store.getState().settings

  if (!notionApiKey || !notionDatabaseID) {
    window.message.error({ content: i18n.t('message.error.notion.no_api_key'), key: 'notion-no-apikey-error' })
    return
  }

  try {
    const notion = new Client({ auth: notionApiKey })
    const notionBlocks = await convertMarkdownToNotionBlocks(content)

    if (notionBlocks.length === 0) {
      throw new Error('No content to export')
    }

    const response = await notion.pages.create({
      parent: { database_id: notionDatabaseID },
      properties: {
        [store.getState().settings.notionPageNameKey || 'Name']: {
          title: [{ text: { content: title } }]
        }
      },
      children: notionBlocks as any[]
    })

    window.message.success({ content: i18n.t('message.success.notion.export'), key: 'notion-success' })
    return response
  } catch (error: any) {
    window.message.error({ content: i18n.t('message.error.notion.export'), key: 'notion-error' })
    return null
  } finally {
    setExportState({
      isExporting: false
    })
  }
}

export const exportMarkdownToYuque = async (title: string, content: string) => {
  const { isExporting } = store.getState().runtime.export
  const { yuqueToken, yuqueRepoId } = store.getState().settings

  if (isExporting) {
    window.message.warning({ content: i18n.t('message.warn.yuque.exporting'), key: 'yuque-exporting' })
    return
  }

  if (!yuqueToken || !yuqueRepoId) {
    window.message.error({ content: i18n.t('message.error.yuque.no_config'), key: 'yuque-no-config-error' })
    return
  }

  setExportState({ isExporting: true })

  try {
    const response = await fetch(`https://www.yuque.com/api/v2/repos/${yuqueRepoId}/docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': yuqueToken,
        'User-Agent': 'CherryAI'
      },
      body: JSON.stringify({
        title: title,
        slug: Date.now().toString(), // Use timestamp as unique slug
        format: 'markdown',
        body: content
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const doc_id = data.data.id

    const tocResponse = await fetch(`https://www.yuque.com/api/v2/repos/${yuqueRepoId}/toc`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': yuqueToken,
        'User-Agent': 'CherryAI'
      },
      body: JSON.stringify({
        action: 'appendNode',
        action_mode: 'sibling',
        doc_ids: [doc_id]
      })
    })

    if (!tocResponse.ok) {
      throw new Error(`HTTP error! status: ${tocResponse.status}`)
    }

    window.message.success({
      content: i18n.t('message.success.yuque.export'),
      key: 'yuque-success'
    })
    return data
  } catch (error: any) {
    window.message.error({
      content: i18n.t('message.error.yuque.export'),
      key: 'yuque-error'
    })
    return null
  } finally {
    setExportState({ isExporting: false })
  }
}

/**
 * Export Markdown to Obsidian
 * @param attributes Document attributes
 * @param attributes.title Title
 * @param attributes.created Creation time
 * @param attributes.source Source
 * @param attributes.tags Tags
 * @param attributes.processingMethod Processing method
 * @param attributes.folder Selected folder path or file path
 * @param attributes.vault Selected Vault name
 */
export const exportMarkdownToObsidian = async (attributes: any) => {
  try {
    // Get Vault name from parameters
    const obsidianVault = attributes.vault
    const obsidianFolder = attributes.folder || ''
    let isMarkdownFile = false

    // Check if Obsidian Vault is configured
    if (!obsidianVault) {
      window.message.error(i18n.t('chat.topics.export.obsidian_not_configured'))
      return
    }

    if (!attributes.title) {
      window.message.error(i18n.t('chat.topics.export.obsidian_title_required'))
      return
    }

    // Check if a .md file is selected
    if (obsidianFolder && obsidianFolder.endsWith('.md')) {
      isMarkdownFile = true
    }

    let filePath = ''

    // Check if a .md file is selected, use its path directly
    if (isMarkdownFile) {
      filePath = obsidianFolder
    } else {
      // Otherwise, construct the path with a trailing slash
      const separator = isWindows ? '\\' : '/'
      filePath = `${obsidianFolder}${obsidianFolder.endsWith(separator) ? '' : separator}${attributes.title}.md`
    }

    // Remove invalid characters for Obsidian on all platforms
    let sanitized = filePath.replace(/[#|\\^\\[\]]/g, '')

    if (isWindows) {
      // Windows-specific cleaning
      sanitized = sanitized
        .replace(/[<>:"\\/|?*]/g, '') // Remove invalid characters
        .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, '_$1$2') // Avoid reserved names
        .replace(/[\s.]+$/, '') // Remove trailing spaces and dots
    } else if (isMac) {
      // Mac-specific cleaning
      sanitized = sanitized
        .replace(/[/:\u0020-\u007E]/g, '') // Remove invalid characters
        .replace(/^\./, '_') // Avoid starting with a dot
    }

    // Common operations for all platforms
    sanitized = sanitized
      .replace(/^\.+/, '') // Remove leading dots
      .trim() // Remove leading and trailing spaces
      .slice(0, 245) // Truncate to 245 characters

    // Ensure the filename is not empty
    if (sanitized.length === 0) {
      sanitized = 'Untitled'
    }

    return sanitized
  } catch (error) {
    console.error('Error exporting to Obsidian:', error)
    window.message.error(i18n.t('message.error.export_failed'))
    throw error
  }
}

export const exportMarkdownToJoplin = async (title: string, content: string) => {
  const { joplinUrl, joplinToken } = store.getState().settings

  if (!joplinUrl || !joplinToken) {
    window.message.error(i18n.t('message.error.joplin.no_config'))
    return
  }

  try {
    const baseUrl = joplinUrl.endsWith('/') ? joplinUrl : `${joplinUrl}/`
    const response = await fetch(`${baseUrl}notes?token=${joplinToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        body: content,
        source: 'Cherry Studio'
      })
    })

    if (!response.ok) {
      throw new Error('service not available')
    }

    const data = await response.json()
    if (data?.error) {
      throw new Error('response error')
    }

    window.message.success(i18n.t('message.success.joplin.export'))
    return
  } catch (error) {
    window.message.error(i18n.t('message.error.joplin.export'))
    return
  }
}

/**
 * Export Markdown to SiYuan Note
 * @param title Note title
 * @param content Note content
 */
export const exportMarkdownToSiyuan = async (title: string, content: string) => {
  const { isExporting } = store.getState().runtime.export
  const { siyuanApiUrl, siyuanToken, siyuanBoxId, siyuanRootPath } = store.getState().settings

  if (isExporting) {
    window.message.warning({ content: i18n.t('message.warn.siyuan.exporting'), key: 'siyuan-exporting' })
    return
  }

  if (!siyuanApiUrl || !siyuanToken || !siyuanBoxId) {
    window.message.error({ content: i18n.t('message.error.siyuan.no_config'), key: 'siyuan-no-config-error' })
    return
  }

  setExportState({ isExporting: true })

  try {
    // Test connection
    const testResponse = await fetch(`${siyuanApiUrl}/api/notebook/lsNotebooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${siyuanToken}`
      }
    })

    if (!testResponse.ok) {
      throw new Error('API request failed')
    }

    const testData = await testResponse.json()
    if (testData.code !== 0) {
      throw new Error(`${testData.msg || i18n.t('message.error.unknown')}`)
    }

    // Ensure the root path starts with /
    const rootPath = siyuanRootPath?.startsWith('/') ? siyuanRootPath : `/${siyuanRootPath || 'CherryStudio'}`

    // Create document
    const docTitle = `${title.replace(/[#|\\^\\[\]]/g, '')}`
    const docPath = `${rootPath}/${docTitle}`

    // Create document
    await createSiyuanDoc(siyuanApiUrl, siyuanToken, siyuanBoxId, docPath, content)

    window.message.success({
      content: i18n.t('message.success.siyuan.export'),
      key: 'siyuan-success'
    })
  } catch (error) {
    console.error('Export to SiYuan Note failed:', error)
    window.message.error({
      content: i18n.t('message.error.siyuan.export') + (error instanceof Error ? `: ${error.message}` : ''),
      key: 'siyuan-error'
    })
  } finally {
    setExportState({ isExporting: false })
  }
}

/**
 * Create SiYuan Note document
 */
async function createSiyuanDoc(
  apiUrl: string,
  token: string,
  boxId: string,
  path: string,
  markdown: string
): Promise<string> {
  const response = await fetch(`${apiUrl}/api/filetree/createDocWithMd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`
    },
    body: JSON.stringify({
      notebook: boxId,
      path: path,
      markdown: markdown
    })
  })

  const data = await response.json()
  if (data.code !== 0) {
    throw new Error(`${data.msg || i18n.t('message.error.unknown')}`)
  }

  return data.data
}
