import { isWin } from '@main/constant'
import { IpcChannel } from '@shared/IpcChannel'
import { UpdateInfo } from 'builder-util-runtime'
import { app, BrowserWindow, dialog } from 'electron'
import logger from 'electron-log'
import { AppUpdater as _AppUpdater, autoUpdater } from 'electron-updater'

import icon from '../../../build/icon.png?asset'
import { configManager } from './ConfigManager'

export default class AppUpdater {
  autoUpdater: _AppUpdater = autoUpdater
  private releaseInfo: UpdateInfo | undefined

  constructor(mainWindow: BrowserWindow) {
    logger.transports.file.level = 'info'

    autoUpdater.logger = logger
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    autoUpdater.autoDownload = configManager.getAutoUpdate()
    autoUpdater.autoInstallOnAppQuit = configManager.getAutoUpdate()

    // Detect download errors
    autoUpdater.on('error', (error) => {
      // Simply record error information and timestamp
      logger.error('Update error', {
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      })
      mainWindow.webContents.send(IpcChannel.UpdateError, error)
    })

    autoUpdater.on('update-available', (releaseInfo: UpdateInfo) => {
      logger.info('New version detected', releaseInfo)
      mainWindow.webContents.send(IpcChannel.UpdateAvailable, releaseInfo)
    })

    // When no update is needed
    autoUpdater.on('update-not-available', () => {
      mainWindow.webContents.send(IpcChannel.UpdateNotAvailable)
    })

    // Update download progress
    autoUpdater.on('download-progress', (progress) => {
      mainWindow.webContents.send(IpcChannel.DownloadProgress, progress)
    })

    // When update content download is complete
    autoUpdater.on('update-downloaded', (releaseInfo: UpdateInfo) => {
      mainWindow.webContents.send(IpcChannel.UpdateDownloaded, releaseInfo)
      this.releaseInfo = releaseInfo
      logger.info('Download complete', releaseInfo)
    })

    this.autoUpdater = autoUpdater
  }

  public setAutoUpdate(isActive: boolean) {
    autoUpdater.autoDownload = isActive
    autoUpdater.autoInstallOnAppQuit = isActive
  }

  public async checkForUpdates() {
    if (isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env) {
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }

    try {
      const update = await this.autoUpdater.checkForUpdates()
      if (update?.isUpdateAvailable && !this.autoUpdater.autoDownload) {
        // If autoDownload is false, need to call the function below to trigger it
        // do not use await, because it will block the return of this function
        this.autoUpdater.downloadUpdate()
      }

      return {
        currentVersion: this.autoUpdater.currentVersion,
        updateInfo: update?.updateInfo
      }
    } catch (error) {
      logger.error('Failed to check for update:', error)
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }
  }

  public async showUpdateDialog(mainWindow: BrowserWindow) {
    if (!this.releaseInfo) {
      return
    }

    dialog
      .showMessageBox({
        type: 'info',
        title: 'Install Update',
        icon,
        message: `New version ${this.releaseInfo.version} is ready`,
        detail: this.formatReleaseNotes(this.releaseInfo.releaseNotes),
        buttons: ['Install Later', 'Install Now'],
        defaultId: 1,
        cancelId: 0
      })
      .then(({ response }) => {
        if (response === 1) {
          app.isQuitting = true
          setImmediate(() => autoUpdater.quitAndInstall())
        } else {
          mainWindow.webContents.send(IpcChannel.UpdateDownloadedCancelled)
        }
      })
  }

  private formatReleaseNotes(releaseNotes: string | ReleaseNoteInfo[] | null | undefined): string {
    if (!releaseNotes) {
      return 'No update notes available'
    }

    if (typeof releaseNotes === 'string') {
      return releaseNotes
    }

    return releaseNotes.map((note) => note.note).join('\n')
  }
}

interface ReleaseNoteInfo {
  readonly version: string
  readonly note: string | null
}
