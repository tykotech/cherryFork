import { createSelector } from '@reduxjs/toolkit'
import Logger from '@renderer/config/logger'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { estimateUserPromptUsage } from '@renderer/services/TokenService'
import store, { type RootState, useAppDispatch, useAppSelector } from '@renderer/store'
import { messageBlocksSelectors, updateOneBlock } from '@renderer/store/messageBlock'
import { newMessagesActions, selectMessagesForTopic } from '@renderer/store/newMessage'
import {
  appendAssistantResponseThunk,
  clearTopicMessagesThunk,
  cloneMessagesToNewTopicThunk,
  deleteMessageGroupThunk,
  deleteSingleMessageThunk,
  initiateTranslationThunk,
  regenerateAssistantResponseThunk,
  resendMessageThunk,
  resendUserMessageWithEditThunk,
  updateMessageAndBlocksThunk,
  updateTranslationBlockThunk
} from '@renderer/store/thunk/messageThunk'
import type { Assistant, Model, Topic } from '@renderer/types'
import type { Message, MessageBlock } from '@renderer/types/newMessage'
import { MessageBlockStatus, MessageBlockType } from '@renderer/types/newMessage'
import { abortCompletion } from '@renderer/utils/abortController'
import { findFileBlocks } from '@renderer/utils/messageUtils/find'
import { useCallback } from 'react'

const findMainTextBlockId = (message: Message): string | undefined => {
  if (!message || !message.blocks) return undefined
  const state = store.getState()
  for (const blockId of message.blocks) {
    const block = messageBlocksSelectors.selectById(state, String(blockId))
    if (block && block.type === MessageBlockType.MAIN_TEXT) {
      return block.id
    }
  }
  return undefined
}

const selectMessagesState = (state: RootState) => state.messages

export const selectNewTopicLoading = createSelector(
  [selectMessagesState, (_, topicId: string) => topicId],
  (messagesState, topicId) => messagesState.loadingByTopic[topicId] || false
)

export const selectNewDisplayCount = createSelector(
  [selectMessagesState],
  (messagesState) => messagesState.displayCount
)

/**
 * Hook providing various operations for messages within a specific topic.
 * @param topic The current topic object.
 * @returns An object containing message operation functions.
 */
export function useMessageOperations(topic: Topic) {
  const dispatch = useAppDispatch()

  /**
   * Deletes a single message.
   * Dispatches deleteSingleMessageThunk.
   */
  const deleteMessage = useCallback(
    async (id: string) => {
      await dispatch(deleteSingleMessageThunk(topic.id, id))
    },
    [dispatch, topic.id]
  )

  /**
   * Deletes a group of messages (based on askId).
   * Dispatches deleteMessageGroupThunk.
   */
  const deleteGroupMessages = useCallback(
    async (askId: string) => {
      await dispatch(deleteMessageGroupThunk(topic.id, askId))
    },
    [dispatch, topic.id]
  )

  /**
   * Edits a message.
   * Uses newMessagesActions.updateMessage.
   */
  const editMessage = useCallback(
    async (messageId: string, updates: Partial<Omit<Message, 'id' | 'topicId' | 'blocks'>>) => {
      if (!topic?.id) {
        console.error('[editMessage] Topic prop is not valid.')
        return
      }

      const messageUpdates: Partial<Message> & Pick<Message, 'id'> = {
        id: messageId,
        updatedAt: new Date().toISOString(),
        ...updates
      }

      // Call the thunk with topic.id and only message updates
      await dispatch(updateMessageAndBlocksThunk(topic.id, messageUpdates, []))
    },
    [dispatch, topic.id]
  )

  /**
   * Resends a user message, triggering regeneration of all its assistant responses.
   * Dispatches resendMessageThunk.
   */
  const resendMessage = useCallback(
    async (message: Message, assistant: Assistant) => {
      await dispatch(resendMessageThunk(topic.id, message, assistant))
    },
    [dispatch, topic.id]
  )

  /**
   * Resends a user message after its main text block has been edited.
   * Dispatches resendUserMessageWithEditThunk.
   */
  const resendUserMessageWithEdit = useCallback(
    async (message: Message, editedContent: string, assistant: Assistant) => {
      const mainTextBlockId = findMainTextBlockId(message)
      if (!mainTextBlockId) {
        console.error('Cannot resend edited message: Main text block not found.')
        return
      }

      const files = findFileBlocks(message).map((block) => block.file)

      const usage = await estimateUserPromptUsage({ content: editedContent, files })
      const messageUpdates: Partial<Message> & Pick<Message, 'id'> = {
        id: message.id,
        updatedAt: new Date().toISOString(),
        usage
      }

      await dispatch(
        newMessagesActions.updateMessage({ topicId: topic.id, messageId: message.id, updates: messageUpdates })
      )
      // The modification of the message will be saved in the thunk below
      await dispatch(resendUserMessageWithEditThunk(topic.id, message, mainTextBlockId, editedContent, assistant))
    },
    [dispatch, topic.id]
  )

  /**
   * Clears all messages for the current or specified topic.
   * Dispatches clearTopicMessagesThunk.
   */
  const clearTopicMessages = useCallback(
    async (_topicId?: string) => {
      const topicIdToClear = _topicId || topic.id
      await dispatch(clearTopicMessagesThunk(topicIdToClear))
    },
    [dispatch, topic.id]
  )

  /**
   * Emits an event to signal creating a new context (clearing messages UI).
   */
  const createNewContext = useCallback(async () => {
    EventEmitter.emit(EVENT_NAMES.NEW_CONTEXT)
  }, [])

  const displayCount = useAppSelector(selectNewDisplayCount)

  /**
   * Pauses ongoing message generation for the current topic.
   */
  const pauseMessages = useCallback(async () => {
    const state = store.getState()
    const topicMessages = selectMessagesForTopic(state, topic.id)
    if (!topicMessages) return

    const streamingMessages = topicMessages.filter((m) => m.status === 'processing' || m.status === 'pending')
    const askIds = [...new Set(streamingMessages?.map((m) => m.askId).filter((id) => !!id) as string[])]

    for (const askId of askIds) {
      abortCompletion(askId)
    }
    dispatch(newMessagesActions.setTopicLoading({ topicId: topic.id, loading: false }))
  }, [topic.id, dispatch])

  /**
   * Resumes/Resends a user message (currently reuses resendMessage logic).
   */
  const resumeMessage = useCallback(
    async (message: Message, assistant: Assistant) => {
      return resendMessage(message, assistant)
    },
    [resendMessage]
  )

  /**
   * Regenerates a specific assistant message response.
   * Dispatches regenerateAssistantResponseThunk.
   */
  const regenerateAssistantMessage = useCallback(
    async (message: Message, assistant: Assistant) => {
      if (message.role !== 'assistant') {
        console.warn('regenerateAssistantMessage should only be called for assistant messages.')
        return
      }
      await dispatch(regenerateAssistantResponseThunk(topic.id, message, assistant))
    },
    [dispatch, topic.id]
  )

  /**
   * Appends a new assistant response using a specified model, replying to the same user query as an existing assistant message.
   * Dispatches appendAssistantResponseThunk.
   */
  const appendAssistantResponse = useCallback(
    async (existingAssistantMessage: Message, newModel: Model, assistant: Assistant) => {
      if (existingAssistantMessage.role !== 'assistant') {
        console.error('appendAssistantResponse should only be called for an existing assistant message.')
        return
      }
      if (!existingAssistantMessage.askId) {
        console.error('Cannot append response: The existing assistant message is missing its askId.')
        return
      }
      await dispatch(appendAssistantResponseThunk(topic.id, existingAssistantMessage.id, newModel, assistant))
    },
    [dispatch, topic.id]
  )

  /**
   * Initiates a translation block and returns an updater function.
   * @param messageId The ID of the message to translate.
   * @param targetLanguage The target language code.
   * @param sourceBlockId (Optional) The ID of the source block.
   * @param sourceLanguage (Optional) The source language code.
   * @returns An async function to update the translation block, or null if initiation fails.
   */
  const getTranslationUpdater = useCallback(
    async (
      messageId: string,
      targetLanguage: string,
      sourceBlockId?: string,
      sourceLanguage?: string
    ): Promise<((accumulatedText: string, isComplete?: boolean) => void) | null> => {
      if (!topic.id) return null

      const state = store.getState()
      const message = state.messages.entities[messageId]
      if (!message) {
        console.error('[getTranslationUpdater] cannot find message:', messageId)
        return null
      }

      let existingTranslationBlockId: string | undefined
      if (message.blocks && message.blocks.length > 0) {
        for (const blockId of message.blocks) {
          const block = state.messageBlocks.entities[blockId]
          if (block && block.type === MessageBlockType.TRANSLATION) {
            existingTranslationBlockId = blockId
            break
          }
        }
      }

      let blockId: string | undefined
      if (existingTranslationBlockId) {
        blockId = existingTranslationBlockId
        const changes: Partial<MessageBlock> = {
          content: '',
          status: MessageBlockStatus.STREAMING,
          metadata: {
            targetLanguage,
            sourceBlockId,
            sourceLanguage
          }
        }
        dispatch(updateOneBlock({ id: blockId, changes }))
        await dispatch(updateTranslationBlockThunk(blockId, '', false))
      } else {
        blockId = await dispatch(
          initiateTranslationThunk(messageId, topic.id, targetLanguage, sourceBlockId, sourceLanguage)
        )
      }

      if (!blockId) {
        console.error('[getTranslationUpdater] Failed to create translation block.')
        return null
      }

      return (accumulatedText: string, isComplete: boolean = false) => {
        dispatch(updateTranslationBlockThunk(blockId!, accumulatedText, isComplete))
      }
    },
    [dispatch, topic.id]
  )

  /**
   * Creates a topic branch by cloning messages to a new topic.
   * @param sourceTopicId Source topic ID
   * @param branchPointIndex Branch point index, messages before this index will be cloned
   * @param newTopic New topic object, must be already created and added to Redux store
   * @returns Whether the operation was successful
   */
  const createTopicBranch = useCallback(
    (sourceTopicId: string, branchPointIndex: number, newTopic: Topic) => {
      Logger.log(`Cloning messages from topic ${sourceTopicId} to new topic ${newTopic.id}`)
      return dispatch(cloneMessagesToNewTopicThunk(sourceTopicId, branchPointIndex, newTopic))
    },
    [dispatch]
  )

  /**
   * Updates properties of specific message blocks (e.g., content).
   * Uses the generalized thunk for persistence.
   */
  const editMessageBlocks = useCallback(
    async (messageId: string, updates: Partial<MessageBlock>) => {
      if (!topic?.id) {
        console.error('[editMessageBlocks] Topic prop is not valid.')
        return
      }

      const blockUpdatesListProcessed = {
        updatedAt: new Date().toISOString(),
        ...updates
      }

      const messageUpdates: Partial<Message> & Pick<Message, 'id'> = {
        id: messageId,
        updatedAt: new Date().toISOString()
      }

      await dispatch(updateMessageAndBlocksThunk(topic.id, messageUpdates, [blockUpdatesListProcessed]))
    },
    [dispatch, topic.id]
  )

  /**
   * Removes a specific block from a message.
   */
  const removeMessageBlock = useCallback(
    async (messageId: string, blockIdToRemove: string) => {
      if (!topic?.id) {
        console.error('[removeMessageBlock] Topic prop is not valid.')
        return
      }

      const state = store.getState()
      const message = state.messages.entities[messageId]
      if (!message || !message.blocks) {
        console.error('[removeMessageBlock] Message not found or has no blocks:', messageId)
        return
      }

      const updatedBlocks = message.blocks.filter((blockId) => blockId !== blockIdToRemove)

      const messageUpdates: Partial<Message> & Pick<Message, 'id'> = {
        id: messageId,
        updatedAt: new Date().toISOString(),
        blocks: updatedBlocks
      }

      await dispatch(updateMessageAndBlocksThunk(topic.id, messageUpdates, []))
    },
    [dispatch, topic?.id]
  )

  return {
    displayCount,
    deleteMessage,
    deleteGroupMessages,
    editMessage,
    resendMessage,
    regenerateAssistantMessage,
    resendUserMessageWithEdit,
    appendAssistantResponse,
    createNewContext,
    clearTopicMessages,
    pauseMessages,
    resumeMessage,
    getTranslationUpdater,
    createTopicBranch,
    editMessageBlocks,
    removeMessageBlock
  }
}

export const useTopicMessages = (topicId: string) => {
  return useAppSelector((state) => selectMessagesForTopic(state, topicId))
}

export const useTopicLoading = (topic: Topic) => {
  return useAppSelector((state) => selectNewTopicLoading(state, topic.id))
}
