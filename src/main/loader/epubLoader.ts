import { BaseLoader } from '@cherrystudio/embedjs-interfaces'
import { cleanString } from '@cherrystudio/embedjs-utils'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { getTempDir } from '@main/utils/file'
import Logger from 'electron-log'
import EPub from 'epub'
import * as fs from 'fs'
import path from 'path'

/**
 * epub loader configuration options
 */
interface EpubLoaderOptions {
  /** epub file path */
  filePath: string
  /** text chunk size */
  chunkSize: number
  /** chunk overlap size */
  chunkOverlap: number
}

/**
 * epub file metadata information
 */
interface EpubMetadata {
  /** Author display name (e.g., "Lewis Carroll") */
  creator?: string
  /** Author normalized name for sorting and indexing (e.g., "Carroll, Lewis") */
  creatorFileAs?: string
  /** Book title (e.g., "Alice's Adventures in Wonderland") */
  title?: string
  /** Language code (e.g., "en" or "zh-CN") */
  language?: string
  /** Subject or category (e.g., "Fantasy", "Fiction") */
  subject?: string
  /** Creation date (e.g., "2024-02-14") */
  date?: string
  /** Book description or summary */
  description?: string
}

/**
 * epub chapter information
 */
interface EpubChapter {
  /** Chapter ID */
  id: string
  /** Chapter title */
  title?: string
  /** Chapter order */
  order?: number
}

/**
 * epub file loader
 * Used to parse epub ebook files, extract text content and metadata
 */
export class EpubLoader extends BaseLoader<Record<string, string | number | boolean>, Record<string, unknown>> {
  protected filePath: string
  protected chunkSize: number
  protected chunkOverlap: number
  private extractedText: string
  private metadata: EpubMetadata | null

  /**
   * Create epub loader instance
   * @param options Loader configuration options
   */
  constructor(options: EpubLoaderOptions) {
    super(options.filePath, {
      chunkSize: options.chunkSize,
      chunkOverlap: options.chunkOverlap
    })
    this.filePath = options.filePath
    this.chunkSize = options.chunkSize
    this.chunkOverlap = options.chunkOverlap
    this.extractedText = ''
    this.metadata = null
  }

  /**
   * Wait for epub file initialization to complete
   * The epub library uses an event mechanism, need to wait for the 'end' event before accessing file content
   * @param epub epub instance
   * @returns metadata and chapter information
   */
  private waitForEpubInit(epub: any): Promise<{ metadata: EpubMetadata; chapters: EpubChapter[] }> {
    return new Promise((resolve, reject) => {
      epub.on('end', () => {
        // Extract metadata
        const metadata: EpubMetadata = {
          creator: epub.metadata.creator,
          creatorFileAs: epub.metadata.creatorFileAs,
          title: epub.metadata.title,
          language: epub.metadata.language,
          subject: epub.metadata.subject,
          date: epub.metadata.date,
          description: epub.metadata.description
        }

        // Extract chapter information
        const chapters: EpubChapter[] = epub.flow.map((chapter: any, index: number) => ({
          id: chapter.id,
          title: chapter.title || `Chapter ${index + 1}`,
          order: index + 1
        }))

        resolve({ metadata, chapters })
      })

      epub.on('error', (error: Error) => {
        reject(error)
      })

      epub.parse()
    })
  }

  /**
   * Get chapter content
   * @param epub epub instance
   * @param chapterId chapter ID
   * @returns chapter text content
   */
  private getChapter(epub: any, chapterId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      epub.getChapter(chapterId, (error: Error | null, text: string) => {
        if (error) {
          reject(error)
        } else {
          resolve(text)
        }
      })
    })
  }

  /**
   * Extract text content from epub file
   * 1. Check if file exists
   * 2. Initialize epub and get metadata
   * 3. Traverse all chapters and extract text
   * 4. Clean HTML tags
   * 5. Merge all chapter text
   */
  private async extractTextFromEpub() {
    try {
      // Check if file exists
      if (!fs.existsSync(this.filePath)) {
        throw new Error(`File not found: ${this.filePath}`)
      }

      const epub = new EPub(this.filePath)

      // Wait for epub initialization and get metadata
      const { metadata, chapters } = await this.waitForEpubInit(epub)
      this.metadata = metadata

      if (!epub.flow || epub.flow.length === 0) {
        throw new Error('No content found in epub file')
      }

      // Use temporary file instead of memory array
      const tempFilePath = path.join(getTempDir(), `epub-${Date.now()}.txt`)
      const writeStream = fs.createWriteStream(tempFilePath)

      // Traverse all chapters
      for (const chapter of chapters) {
        try {
          const content = await this.getChapter(epub, chapter.id)

          if (!content) {
            continue
          }

          // Remove HTML tags and clean text
          const text = content
            .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
            .replace(/\s+/g, ' ') // Replace multiple whitespace with a single space
            .trim() // Remove leading and trailing whitespace

          if (text) {
            // Write directly to file
            writeStream.write(text + '\n\n')
          }
        } catch (error) {
          Logger.error(`[EpubLoader] Error processing chapter ${chapter.id}:`, error)
        }
      }

      // Close write stream
      writeStream.end()

      // Wait for write to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      })

      // Read content from temporary file
      this.extractedText = fs.readFileSync(tempFilePath, 'utf-8')

      // Delete temporary file
      fs.unlinkSync(tempFilePath)

      // Only add one completion log
      Logger.info(`[EpubLoader] Ebook ${this.metadata?.title || path.basename(this.filePath)} processed successfully`)
    } catch (error) {
      Logger.error('[EpubLoader] Error in extractTextFromEpub:', error)
      throw error
    }
  }

  /**
   * Generate text chunks
   * Override BaseLoader's method, split the extracted text into appropriate size chunks
   * Each chunk contains source file and metadata information
   */
  override async *getUnfilteredChunks() {
    // If text has not been extracted, extract first
    if (!this.extractedText) {
      await this.extractTextFromEpub()
    }

    Logger.info(
      '[EpubLoader] Book title:',
      this.metadata?.title || 'Unknown Title',
      ' Text size:',
      this.extractedText.length
    )

    // Create text splitter
    const chunker = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap
    })

    // Clean and split text
    const chunks = await chunker.splitText(cleanString(this.extractedText))

    // Add metadata to each text chunk
    for (const chunk of chunks) {
      yield {
        pageContent: chunk,
        metadata: {
          source: this.filePath,
          title: this.metadata?.title || '',
          creator: this.metadata?.creator || '',
          language: this.metadata?.language || ''
        }
      }
    }
  }
}
