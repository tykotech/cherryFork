import { IpcChannel } from '@shared/IpcChannel'
import { WebDavConfig } from '@types'
import archiver from 'archiver'
import { exec } from 'child_process'
import { app } from 'electron'
import Logger from 'electron-log'
import * as fs from 'fs-extra'
import StreamZip from 'node-stream-zip'
import * as path from 'path'
import { createClient, CreateDirectoryOptions, FileStat } from 'webdav'

import WebDav from './WebDav'
import { windowService } from './WindowService'

class BackupManager {
  private tempDir = path.join(app.getPath('temp'), 'cherry-studio', 'backup', 'temp')
  private backupDir = path.join(app.getPath('temp'), 'cherry-studio', 'backup')

  constructor() {
    this.checkConnection = this.checkConnection.bind(this)
    this.backup = this.backup.bind(this)
    this.restore = this.restore.bind(this)
    this.backupToWebdav = this.backupToWebdav.bind(this)
    this.restoreFromWebdav = this.restoreFromWebdav.bind(this)
    this.listWebdavFiles = this.listWebdavFiles.bind(this)
    this.deleteWebdavFile = this.deleteWebdavFile.bind(this)
  }

  private async setWritableRecursive(dirPath: string): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name)

        // First process subdirectories
        if (item.isDirectory()) {
          await this.setWritableRecursive(fullPath)
        }

        // Set permissions (Windows needs special handling)
        await this.forceSetWritable(fullPath)
      }

      // Ensure root directory permissions
      await this.forceSetWritable(dirPath)
    } catch (error) {
      Logger.error(`Permission setting failed: ${dirPath}`, error)
      throw error
    }
  }

  // New cross-platform permission setting method
  private async forceSetWritable(targetPath: string): Promise<void> {
    try {
      // Windows needs to remove read-only attribute first
      if (process.platform === 'win32') {
        await fs.chmod(targetPath, 0o666) // Windows ignores permission bits but can remove read-only
      } else {
        const stats = await fs.stat(targetPath)
        const mode = stats.isDirectory() ? 0o777 : 0o666
        await fs.chmod(targetPath, mode)
      }

      // Double insurance: use file attribute command (Windows only)
      if (process.platform === 'win32') {
        await exec(`attrib -R "${targetPath}" /L /D`)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        Logger.warn(`Permission setting warning: ${targetPath}`, error)
      }
    }
  }

  async backup(
    _: Electron.IpcMainInvokeEvent,
    fileName: string,
    data: string,
    destinationPath: string = this.backupDir
  ): Promise<string> {
    const mainWindow = windowService.getMainWindow()

    const onProgress = (processData: { stage: string; progress: number; total: number }) => {
      mainWindow?.webContents.send(IpcChannel.BackupProgress, processData)
      Logger.log('[BackupManager] backup progress', processData)
    }

    try {
      await fs.ensureDir(this.tempDir)
      onProgress({ stage: 'preparing', progress: 0, total: 100 })

      // Write data.json using stream
      const tempDataPath = path.join(this.tempDir, 'data.json')

      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(tempDataPath)
        writeStream.write(data)
        writeStream.end()

        writeStream.on('finish', () => resolve())
        writeStream.on('error', (error) => reject(error))
      })

      onProgress({ stage: 'writing_data', progress: 20, total: 100 })

      // Copy Data directory to temp directory
      const sourcePath = path.join(app.getPath('userData'), 'Data')
      const tempDataDir = path.join(this.tempDir, 'Data')

      // Get total size of source directory
      const totalSize = await this.getDirSize(sourcePath)
      let copiedSize = 0

      // Stream copy
      await this.copyDirWithProgress(sourcePath, tempDataDir, (size) => {
        copiedSize += size
        const progress = Math.min(50, Math.floor((copiedSize / totalSize) * 50))
        onProgress({ stage: 'copying_files', progress, total: 100 })
      })

      await this.setWritableRecursive(tempDataDir)
      onProgress({ stage: 'preparing_compression', progress: 50, total: 100 })

      // Create output file stream
      const backupedFilePath = path.join(destinationPath, fileName)
      const output = fs.createWriteStream(backupedFilePath)

      // Create archiver instance, enable ZIP64 support
      const archive = archiver('zip', {
        zlib: { level: 1 }, // Use lowest compression level for speed
        zip64: true // Enable ZIP64 support for large files
      })

      let lastProgress = 50
      let totalEntries = 0
      let processedEntries = 0
      let totalBytes = 0
      let processedBytes = 0

      // First calculate total file count and size
      const calculateTotals = async (dirPath: string) => {
        const items = await fs.readdir(dirPath, { withFileTypes: true })
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name)
          if (item.isDirectory()) {
            await calculateTotals(fullPath)
          } else {
            totalEntries++
            const stats = await fs.stat(fullPath)
            totalBytes += stats.size
          }
        }
      }

      await calculateTotals(this.tempDir)

      // Listen for file add events
      archive.on('entry', () => {
        processedEntries++
        if (totalEntries > 0) {
          const progressPercent = Math.min(55, 50 + Math.floor((processedEntries / totalEntries) * 5))
          if (progressPercent > lastProgress) {
            lastProgress = progressPercent
            onProgress({ stage: 'compressing', progress: progressPercent, total: 100 })
          }
        }
      })

      // Listen for data write events
      archive.on('data', (chunk) => {
        processedBytes += chunk.length
        if (totalBytes > 0) {
          const progressPercent = Math.min(99, 55 + Math.floor((processedBytes / totalBytes) * 44))
          if (progressPercent > lastProgress) {
            lastProgress = progressPercent
            onProgress({ stage: 'compressing', progress: progressPercent, total: 100 })
          }
        }
      })

      // Use Promise to wait for compression to finish
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          onProgress({ stage: 'compressing', progress: 100, total: 100 })
          resolve()
        })
        archive.on('error', reject)
        archive.on('warning', (err: any) => {
          if (err.code !== 'ENOENT') {
            Logger.warn('[BackupManager] Archive warning:', err)
          }
        })

        // Pipe output stream to archiver
        archive.pipe(output)

        // Add entire temp directory to archive
        archive.directory(this.tempDir, false)

        // Finalize compression
        archive.finalize()
      })

      // Clean up temp directory
      await fs.remove(this.tempDir)
      onProgress({ stage: 'completed', progress: 100, total: 100 })

      Logger.log('[BackupManager] Backup completed successfully')
      return backupedFilePath
    } catch (error) {
      Logger.error('[BackupManager] Backup failed:', error)
      // Ensure temp directory is cleaned up
      await fs.remove(this.tempDir).catch(() => {})
      throw error
    }
  }

  async restore(_: Electron.IpcMainInvokeEvent, backupPath: string): Promise<string> {
    const mainWindow = windowService.getMainWindow()

    const onProgress = (processData: { stage: string; progress: number; total: number }) => {
      mainWindow?.webContents.send(IpcChannel.RestoreProgress, processData)
      Logger.log('[BackupManager] restore progress', processData)
    }

    try {
      // Create temp directory
      await fs.ensureDir(this.tempDir)
      onProgress({ stage: 'preparing', progress: 0, total: 100 })

      Logger.log('[backup] step 1: unzip backup file', this.tempDir)

      const zip = new StreamZip.async({ file: backupPath })
      onProgress({ stage: 'extracting', progress: 15, total: 100 })
      await zip.extract(null, this.tempDir)
      onProgress({ stage: 'extracted', progress: 25, total: 100 })

      Logger.log('[backup] step 2: read data.json')
      // Read data.json
      const dataPath = path.join(this.tempDir, 'data.json')
      const data = await fs.readFile(dataPath, 'utf-8')
      onProgress({ stage: 'reading_data', progress: 35, total: 100 })

      Logger.log('[backup] step 3: restore Data directory')
      // Restore Data directory
      const sourcePath = path.join(this.tempDir, 'Data')
      const destPath = path.join(app.getPath('userData'), 'Data')

      // Get total size of source directory
      const totalSize = await this.getDirSize(sourcePath)
      let copiedSize = 0

      await this.setWritableRecursive(destPath)
      await fs.remove(destPath)

      // Stream copy
      await this.copyDirWithProgress(sourcePath, destPath, (size) => {
        copiedSize += size
        const progress = Math.min(85, 35 + Math.floor((copiedSize / totalSize) * 50))
        onProgress({ stage: 'copying_files', progress, total: 100 })
      })

      Logger.log('[backup] step 4: clean up temp directory')
      // Clean up temp directory
      await this.setWritableRecursive(this.tempDir)
      await fs.remove(this.tempDir)
      onProgress({ stage: 'completed', progress: 100, total: 100 })

      Logger.log('[backup] step 5: Restore completed successfully')

      return data
    } catch (error) {
      Logger.error('[backup] Restore failed:', error)
      await fs.remove(this.tempDir).catch(() => {})
      throw error
    }
  }

  async backupToWebdav(_: Electron.IpcMainInvokeEvent, data: string, webdavConfig: WebDavConfig) {
    const filename = webdavConfig.fileName || 'cherry-studio.backup.zip'
    const backupedFilePath = await this.backup(_, filename, data)
    const webdavClient = new WebDav(webdavConfig)
    try {
      const result = await webdavClient.putFileContents(filename, fs.createReadStream(backupedFilePath), {
        overwrite: true
      })
      // Delete local backup file after successful upload
      await fs.remove(backupedFilePath)
      return result
    } catch (error) {
      // Delete local temp file on upload failure
      await fs.remove(backupedFilePath).catch(() => {})
      throw error
    }
  }

  async restoreFromWebdav(_: Electron.IpcMainInvokeEvent, webdavConfig: WebDavConfig) {
    const filename = webdavConfig.fileName || 'cherry-studio.backup.zip'
    const webdavClient = new WebDav(webdavConfig)
    try {
      const retrievedFile = await webdavClient.getFileContents(filename)
      const backupedFilePath = path.join(this.backupDir, filename)

      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true })
      }

      // Write file using stream
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(backupedFilePath)
        writeStream.write(retrievedFile as Buffer)
        writeStream.end()

        writeStream.on('finish', () => resolve())
        writeStream.on('error', (error) => reject(error))
      })

      return await this.restore(_, backupedFilePath)
    } catch (error: any) {
      Logger.error('[backup] Failed to restore from WebDAV:', error)
      throw new Error(error.message || 'Failed to restore backup file')
    }
  }

  listWebdavFiles = async (_: Electron.IpcMainInvokeEvent, config: WebDavConfig) => {
    try {
      const client = createClient(config.webdavHost, {
        username: config.webdavUser,
        password: config.webdavPass
      })

      const response = await client.getDirectoryContents(config.webdavPath)
      const files = Array.isArray(response) ? response : response.data

      return files
        .filter((file: FileStat) => file.type === 'file' && file.basename.endsWith('.zip'))
        .map((file: FileStat) => ({
          fileName: file.basename,
          modifiedTime: file.lastmod,
          size: file.size
        }))
        .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
    } catch (error: any) {
      Logger.error('Failed to list WebDAV files:', error)
      throw new Error(error.message || 'Failed to list backup files')
    }
  }

  private async getDirSize(dirPath: string): Promise<number> {
    let size = 0
    const items = await fs.readdir(dirPath, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name)
      if (item.isDirectory()) {
        size += await this.getDirSize(fullPath)
      } else {
        const stats = await fs.stat(fullPath)
        size += stats.size
      }
    }
    return size
  }

  private async copyDirWithProgress(
    source: string,
    destination: string,
    onProgress: (size: number) => void
  ): Promise<void> {
    const items = await fs.readdir(source, { withFileTypes: true })

    for (const item of items) {
      const sourcePath = path.join(source, item.name)
      const destPath = path.join(destination, item.name)

      if (item.isDirectory()) {
        await fs.ensureDir(destPath)
        await this.copyDirWithProgress(sourcePath, destPath, onProgress)
      } else {
        const stats = await fs.stat(sourcePath)
        await fs.copy(sourcePath, destPath)
        onProgress(stats.size)
      }
    }
  }

  async checkConnection(_: Electron.IpcMainInvokeEvent, webdavConfig: WebDavConfig) {
    const webdavClient = new WebDav(webdavConfig)
    return await webdavClient.checkConnection()
  }

  async createDirectory(
    _: Electron.IpcMainInvokeEvent,
    webdavConfig: WebDavConfig,
    path: string,
    options?: CreateDirectoryOptions
  ) {
    const webdavClient = new WebDav(webdavConfig)
    return await webdavClient.createDirectory(path, options)
  }

  async deleteWebdavFile(_: Electron.IpcMainInvokeEvent, fileName: string, webdavConfig: WebDavConfig) {
    try {
      const webdavClient = new WebDav(webdavConfig)
      return await webdavClient.deleteFile(fileName)
    } catch (error: any) {
      Logger.error('Failed to delete WebDAV file:', error)
      throw new Error(error.message || 'Failed to delete backup file')
    }
  }
}

export default BackupManager
