/* eslint-disable react-hooks/rules-of-hooks */
import { db } from '@renderer/databases'
import KnowledgeQueue from '@renderer/queue/KnowledgeQueue'
import FileManager from '@renderer/services/FileManager'
import { getKnowledgeBaseParams } from '@renderer/services/KnowledgeService'
import { RootState } from '@renderer/store'
import {
  addBase,
  addFiles as addFilesAction,
  addItem,
  clearAllProcessing,
  clearCompletedProcessing,
  deleteBase,
  removeItem as removeItemAction,
  renameBase,
  updateBase,
  updateBases,
  updateItem as updateItemAction,
  updateItemProcessingStatus,
  updateNotes
} from '@renderer/store/knowledge'
import { FileType, KnowledgeBase, KnowledgeItem, ProcessingStatus } from '@renderer/types'
import { runAsyncFunction } from '@renderer/utils'
import { IpcChannel } from '@shared/IpcChannel'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'

import { useAgents } from './useAgents'
import { useAssistants } from './useAssistant'

export const useKnowledge = (baseId: string) => {
  const dispatch = useDispatch()
  const base = useSelector((state: RootState) => state.knowledge.bases.find((b) => b.id === baseId))

  // Rename knowledge base
  const renameKnowledgeBase = (name: string) => {
    dispatch(renameBase({ baseId, name }))
  }

  // Update knowledge base
  const updateKnowledgeBase = (base: KnowledgeBase) => {
    dispatch(updateBase(base))
  }

  // Batch add files
  const addFiles = (files: FileType[]) => {
    const filesItems: KnowledgeItem[] = files.map((file) => ({
      id: uuidv4(),
      type: 'file' as const,
      content: file,
      created_at: Date.now(),
      updated_at: Date.now(),
      processingStatus: 'pending',
      processingProgress: 0,
      processingError: '',
      retryCount: 0
    }))
    dispatch(addFilesAction({ baseId, items: filesItems }))
    setTimeout(() => KnowledgeQueue.checkAllBases(), 0)
  }

  // Add URL
  const addUrl = (url: string) => {
    const newUrlItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'url' as const,
      content: url,
      created_at: Date.now(),
      updated_at: Date.now(),
      processingStatus: 'pending',
      processingProgress: 0,
      processingError: '',
      retryCount: 0
    }
    dispatch(addItem({ baseId, item: newUrlItem }))
    setTimeout(() => KnowledgeQueue.checkAllBases(), 0)
  }

  // Add note
  const addNote = async (content: string) => {
    const noteId = uuidv4()
    const note: KnowledgeItem = {
      id: noteId,
      type: 'note',
      content,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    // Store complete note in database
    await db.knowledge_notes.add(note)

    // Only store reference in the store
    const noteRef: KnowledgeItem = {
      id: noteId,
      baseId,
      type: 'note',
      content: '', // No need to store actual content in the store
      created_at: Date.now(),
      updated_at: Date.now(),
      processingStatus: 'pending',
      processingProgress: 0,
      processingError: '',
      retryCount: 0
    }

    dispatch(updateNotes({ baseId, item: noteRef }))
    setTimeout(() => KnowledgeQueue.checkAllBases(), 0)
  }

  // Update note content
  const updateNoteContent = async (noteId: string, content: string) => {
    const note = await db.knowledge_notes.get(noteId)
    if (note) {
      const updatedNote = {
        ...note,
        content,
        updated_at: Date.now()
      }
      await db.knowledge_notes.put(updatedNote)
      dispatch(updateNotes({ baseId, item: updatedNote }))
    }
    const noteItem = base?.items.find((item) => item.id === noteId)
    noteItem && refreshItem(noteItem)
  }

  // Get note content
  const getNoteContent = async (noteId: string) => {
    return await db.knowledge_notes.get(noteId)
  }

  const updateItem = (item: KnowledgeItem) => {
    dispatch(updateItemAction({ baseId, item }))
  }

  // Remove item
  const removeItem = async (item: KnowledgeItem) => {
    dispatch(removeItemAction({ baseId, item }))
    if (base) {
      if (item?.uniqueId && item?.uniqueIds) {
        await window.api.knowledgeBase.remove({
          uniqueId: item.uniqueId,
          uniqueIds: item.uniqueIds,
          base: getKnowledgeBaseParams(base)
        })
      }
    }
    if (item.type === 'file' && typeof item.content === 'object') {
      await FileManager.deleteFile(item.content.id)
    }
  }
  // Refresh item
  const refreshItem = async (item: KnowledgeItem) => {
    const status = getProcessingStatus(item.id)

    if (status === 'pending' || status === 'processing') {
      return
    }

    if (base && item.uniqueId && item.uniqueIds) {
      await window.api.knowledgeBase.remove({
        uniqueId: item.uniqueId,
        uniqueIds: item.uniqueIds,
        base: getKnowledgeBaseParams(base)
      })
      updateItem({
        ...item,
        processingStatus: 'pending',
        processingProgress: 0,
        processingError: '',
        uniqueId: undefined
      })
      setTimeout(() => KnowledgeQueue.checkAllBases(), 0)
    }
  }

  // Update processing status
  const updateItemStatus = (itemId: string, status: ProcessingStatus, progress?: number, error?: string) => {
    dispatch(
      updateItemProcessingStatus({
        baseId,
        itemId,
        status,
        progress,
        error
      })
    )
  }

  // Get processing status of a specific item
  const getProcessingStatus = (itemId: string) => {
    return base?.items.find((item) => item.id === itemId)?.processingStatus
  }

  // Get all processing items of a specific type
  const getProcessingItemsByType = (type: 'file' | 'url' | 'note') => {
    return base?.items.filter((item) => item.type === type && item.processingStatus !== undefined) || []
  }

  // Get directory processing progress
  const getDirectoryProcessingPercent = (itemId?: string) => {
    const [percent, setPercent] = useState<number>(0)

    useEffect(() => {
      if (!itemId) {
        return
      }

      const cleanup = window.electron.ipcRenderer.on(
        IpcChannel.DirectoryProcessingPercent,
        (_, { itemId: id, percent }: { itemId: string; percent: number }) => {
          if (itemId === id) {
            setPercent(percent)
          }
        }
      )

      return () => {
        cleanup()
      }
    }, [itemId])

    return percent
  }

  // Clear completed items
  const clearCompleted = () => {
    dispatch(clearCompletedProcessing({ baseId }))
  }

  // Clear all processing statuses
  const clearAll = () => {
    dispatch(clearAllProcessing({ baseId }))
  }

  // Add Sitemap
  const addSitemap = (url: string) => {
    const newSitemapItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'sitemap' as const,
      content: url,
      created_at: Date.now(),
      updated_at: Date.now(),
      processingStatus: 'pending',
      processingProgress: 0,
      processingError: '',
      retryCount: 0
    }
    dispatch(addItem({ baseId, item: newSitemapItem }))
    setTimeout(() => KnowledgeQueue.checkAllBases(), 0)
  }

  // Add directory support
  const addDirectory = (path: string) => {
    const newDirectoryItem: KnowledgeItem = {
      id: uuidv4(),
      type: 'directory',
      content: path,
      created_at: Date.now(),
      updated_at: Date.now(),
      processingStatus: 'pending',
      processingProgress: 0,
      processingError: '',
      retryCount: 0
    }
    dispatch(addItem({ baseId, item: newDirectoryItem }))
    setTimeout(() => KnowledgeQueue.checkAllBases(), 0)
  }

  const fileItems = base?.items.filter((item) => item.type === 'file') || []
  const directoryItems = base?.items.filter((item) => item.type === 'directory') || []
  const urlItems = base?.items.filter((item) => item.type === 'url') || []
  const sitemapItems = base?.items.filter((item) => item.type === 'sitemap') || []
  const [noteItems, setNoteItems] = useState<KnowledgeItem[]>([])

  useEffect(() => {
    const notes = base?.items.filter((item) => item.type === 'note') || []
    runAsyncFunction(async () => {
      const newNoteItems = await Promise.all(
        notes.map(async (item) => {
          const note = await db.knowledge_notes.get(item.id)
          return { ...item, content: note?.content || '' }
        })
      )
      setNoteItems(newNoteItems.filter((note) => note !== undefined) as KnowledgeItem[])
    })
  }, [base?.items])

  return {
    base,
    fileItems,
    urlItems,
    sitemapItems,
    noteItems,
    renameKnowledgeBase,
    updateKnowledgeBase,
    addFiles,
    addUrl,
    addSitemap,
    addNote,
    updateNoteContent,
    getNoteContent,
    updateItem,
    updateItemStatus,
    refreshItem,
    getProcessingStatus,
    getProcessingItemsByType,
    getDirectoryProcessingPercent,
    clearCompleted,
    clearAll,
    removeItem,
    directoryItems,
    addDirectory
  }
}

export const useKnowledgeBases = () => {
  const dispatch = useDispatch()
  const bases = useSelector((state: RootState) => state.knowledge.bases)
  const { assistants, updateAssistants } = useAssistants()
  const { agents, updateAgents } = useAgents()

  const addKnowledgeBase = (base: KnowledgeBase) => {
    dispatch(addBase(base))
  }

  const renameKnowledgeBase = (baseId: string, name: string) => {
    dispatch(renameBase({ baseId, name }))
  }

  const deleteKnowledgeBase = (baseId: string) => {
    dispatch(deleteBase({ baseId }))

    // remove assistant knowledge_base
    const _assistants = assistants.map((assistant) => {
      if (assistant.knowledge_bases?.find((kb) => kb.id === baseId)) {
        return {
          ...assistant,
          knowledge_bases: assistant.knowledge_bases.filter((kb) => kb.id !== baseId)
        }
      }
      return assistant
    })

    // remove agent knowledge_base
    const _agents = agents.map((agent) => {
      if (agent.knowledge_bases?.find((kb) => kb.id === baseId)) {
        return {
          ...agent,
          knowledge_bases: agent.knowledge_bases.filter((kb) => kb.id !== baseId)
        }
      }
      return agent
    })

    updateAssistants(_assistants)
    updateAgents(_agents)
  }

  const updateKnowledgeBases = (bases: KnowledgeBase[]) => {
    dispatch(updateBases(bases))
  }

  return {
    bases,
    addKnowledgeBase,
    renameKnowledgeBase,
    deleteKnowledgeBase,
    updateKnowledgeBases
  }
}
