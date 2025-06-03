import * as fs from 'node:fs'

import { JsonLoader, LocalPathLoader, RAGApplication, TextLoader } from '@cherrystudio/embedjs'
import type { AddLoaderReturn } from '@cherrystudio/embedjs-interfaces'
import { WebLoader } from '@cherrystudio/embedjs-loader-web'
import { LoaderReturn } from '@shared/config/types'
import { FileType, KnowledgeBaseParams } from '@types'
import Logger from 'electron-log'

import { DraftsExportLoader } from './draftsExportLoader'
import { EpubLoader } from './epubLoader'
import { OdLoader, OdType } from './odLoader'

// Mapping from file extension to loader type
const FILE_LOADER_MAP: Record<string, string> = {
  // Built-in types
  '.pdf': 'common',
  '.csv': 'common',
  '.docx': 'common',
  '.pptx': 'common',
  '.xlsx': 'common',
  '.md': 'common',
  // OD types
  '.odt': 'od',
  '.ods': 'od',
  '.odp': 'od',
  // epub type
  '.epub': 'epub',
  // Drafts type
  '.draftsexport': 'drafts',
  // HTML type
  '.html': 'html',
  '.htm': 'html',
  // JSON type
  '.json': 'json'
  // Other types default to text type
}

export async function addOdLoader(
  ragApplication: RAGApplication,
  file: FileType,
  base: KnowledgeBaseParams,
  forceReload: boolean
): Promise<AddLoaderReturn> {
  const loaderMap: Record<string, OdType> = {
    '.odt': OdType.OdtLoader,
    '.ods': OdType.OdsLoader,
    '.odp': OdType.OdpLoader
  }
  const odType = loaderMap[file.ext]
  if (!odType) {
    throw new Error('Unknown odType')
  }
  return ragApplication.addLoader(
    new OdLoader({
      odType,
      filePath: file.path,
      chunkSize: base.chunkSize,
      chunkOverlap: base.chunkOverlap
    }) as any,
    forceReload
  )
}

export async function addFileLoader(
  ragApplication: RAGApplication,
  file: FileType,
  base: KnowledgeBaseParams,
  forceReload: boolean
): Promise<LoaderReturn> {
  // Get file type, default to text type if not matched
  const loaderType = FILE_LOADER_MAP[file.ext.toLowerCase()] || 'text'
  let loaderReturn: AddLoaderReturn

  // JSON type handling
  let jsonObject = {}
  let jsonParsed = true
  Logger.info(`[KnowledgeBase] processing file ${file.path} as ${loaderType} type`)
  switch (loaderType) {
    case 'common':
      // Built-in type handling
      loaderReturn = await ragApplication.addLoader(
        new LocalPathLoader({
          path: file.path,
          chunkSize: base.chunkSize,
          chunkOverlap: base.chunkOverlap
        }) as any,
        forceReload
      )
      break

    case 'od':
      // OD type handling
      loaderReturn = await addOdLoader(ragApplication, file, base, forceReload)
      break
    case 'epub':
      // epub type handling
      loaderReturn = await ragApplication.addLoader(
        new EpubLoader({
          filePath: file.path,
          chunkSize: base.chunkSize ?? 1000,
          chunkOverlap: base.chunkOverlap ?? 200
        }) as any,
        forceReload
      )
      break

    case 'drafts':
      // Drafts type handling
      loaderReturn = await ragApplication.addLoader(new DraftsExportLoader(file.path) as any, forceReload)
      break

    case 'html':
      // HTML type handling
      loaderReturn = await ragApplication.addLoader(
        new WebLoader({
          urlOrContent: fs.readFileSync(file.path, 'utf-8'),
          chunkSize: base.chunkSize,
          chunkOverlap: base.chunkOverlap
        }) as any,
        forceReload
      )
      break

    case 'json':
      try {
        jsonObject = JSON.parse(fs.readFileSync(file.path, 'utf-8'))
      } catch (error) {
        jsonParsed = false
        Logger.warn('[KnowledgeBase] failed parsing json file, falling back to text processing:', file.path, error)
      }

      if (jsonParsed) {
        loaderReturn = await ragApplication.addLoader(new JsonLoader({ object: jsonObject }), forceReload)
        break
      }
    // fallthrough - If JSON parsing fails, process as text
    default:
      // Text type handling (default)
      // If other text type and file not yet read, read file
      loaderReturn = await ragApplication.addLoader(
        new TextLoader({
          text: fs.readFileSync(file.path, 'utf-8'),
          chunkSize: base.chunkSize,
          chunkOverlap: base.chunkOverlap
        }) as any,
        forceReload
      )
      break
  }

  return {
    entriesAdded: loaderReturn.entriesAdded,
    uniqueId: loaderReturn.uniqueId,
    uniqueIds: [loaderReturn.uniqueId],
    loaderType: loaderReturn.loaderType
  } as LoaderReturn
}
