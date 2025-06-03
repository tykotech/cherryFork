import { is } from '@electron-toolkit/utils'
import { isDev, isLinux, isMac, isWin } from '@main/constant'
import { getFilesDir } from '@main/utils/file'
import { IpcChannel } from '@shared/IpcChannel'
import { ThemeMode } from '@types'
import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import Logger from 'electron-log'
import windowStateKeeper from 'electron-window-state'
import { join } from 'path'

import icon from '../../../build/icon.png?asset'
import { titleBarOverlayDark, titleBarOverlayLight } from '../config'
import { configManager } from './ConfigManager'
import { contextMenu } from './ContextMenu'
import { initSessionUserAgent } from './WebviewService'

export class WindowService {
  private static instance: WindowService | null = null
  private mainWindow: BrowserWindow | null = null
  private miniWindow: BrowserWindow | null = null
  private isPinnedMiniWindow: boolean = false
  //hacky-fix: store the focused status of mainWindow before miniWindow shows
  //to restore the focus status when miniWindow hides
  private wasMainWindowFocused: boolean = false
  private lastRendererProcessCrashTime: number = 0

  public static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService()
    }
    return WindowService.instance
  }

  public createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show()
      this.mainWindow.focus()
      return this.mainWindow
    }

    const mainWindowState = windowStateKeeper({
      defaultWidth: 1080,
      defaultHeight: 670,
      fullScreen: false,
      maximize: false
    })

    const theme = configManager.getTheme()
    if (theme === ThemeMode.auto) {
      nativeTheme.themeSource = 'system'
    } else {
      nativeTheme.themeSource = theme
    }

    this.mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 1080,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      transparent: isMac,
      vibrancy: 'sidebar',
      visualEffectState: 'active',
      titleBarStyle: 'hidden',
      titleBarOverlay: nativeTheme.shouldUseDarkColors ? titleBarOverlayDark : titleBarOverlayLight,
      backgroundColor: isMac ? undefined : nativeTheme.shouldUseDarkColors ? '#181818' : '#FFFFFF',
      darkTheme: nativeTheme.shouldUseDarkColors,
      trafficLightPosition: { x: 8, y: 12 },
      ...(isLinux ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        webSecurity: false,
        webviewTag: true,
        allowRunningInsecureContent: true,
        experimentalFeatures: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    this.setupMainWindow(this.mainWindow, mainWindowState)

    //preload miniWindow to resolve series of issues about miniWindow in Mac
    const enableQuickAssistant = configManager.getEnableQuickAssistant()
    if (enableQuickAssistant && !this.miniWindow) {
      this.miniWindow = this.createMiniWindow(true)
    }

    //init the MinApp webviews' useragent
    initSessionUserAgent()

    return this.mainWindow
  }

  private setupMainWindow(mainWindow: BrowserWindow, mainWindowState: any) {
    mainWindowState.manage(mainWindow)

    this.setupMaximize(mainWindow, mainWindowState.isMaximized)
    this.setupContextMenu(mainWindow)
    this.setupWindowEvents(mainWindow)
    this.setupWebContentsHandlers(mainWindow)
    this.setupDevToolsErrorSuppression(mainWindow)
    this.setupWindowLifecycleEvents(mainWindow)
    this.setupMainWindowMonitor(mainWindow)
    this.loadMainWindowContent(mainWindow)
  }

  private setupDevToolsErrorSuppression(mainWindow: BrowserWindow) {
    // Suppress DevTools autofill errors
    mainWindow.webContents.on('console-message', (_event, _level, message) => {
      // Suppress specific autofill-related DevTools errors
      if (
        message.includes('Autofill.enable') ||
        message.includes('Autofill.setAddresses') ||
        message.includes('devtools://devtools/bundled/core/protocol_client') ||
        message.includes('devtools://devtools/bundled/panels/elements')
      ) {
        return // Don't log these specific errors
      }
    })

    // Handle DevTools opened event to suppress autofill
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.devToolsWebContents
        ?.executeJavaScript(
          `
        // Disable autofill in DevTools
        try {
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.method === 'Autofill.enable' || request.method === 'Autofill.setAddresses') {
              sendResponse({error: {code: -32601, message: 'Method not supported in Electron'}});
              return true;
            }
          });
        } catch (e) {
          // Ignore errors from this DevTools patch
        }
      `
        )
        .catch(() => {
          // Ignore errors from DevTools JavaScript execution
        })
    })
  }

  private setupMainWindowMonitor(mainWindow: BrowserWindow) {
    mainWindow.webContents.on('render-process-gone', (_, details) => {
      Logger.error(`Renderer process crashed with: ${JSON.stringify(details)}`)
      const currentTime = Date.now()
      const lastCrashTime = this.lastRendererProcessCrashTime
      this.lastRendererProcessCrashTime = currentTime
      if (currentTime - lastCrashTime > 60 * 1000) {
        // If more than 1 minute, reload the renderer process
        mainWindow.webContents.reload()
      } else {
        // If less than 1 minute, quit the app, likely due to consecutive crashes
        app.exit(1)
      }
    })

    mainWindow.webContents.on('unresponsive', () => {
      // After upgrading to electron 34, we can get specific js stack traces, currently just logging for monitoring
      // https://www.electronjs.org/blog/electron-34-0#unresponsive-renderer-javascript-call-stacks
      Logger.error('Renderer process unresponsive')
    })
  }

  private setupMaximize(mainWindow: BrowserWindow, isMaximized: boolean) {
    if (isMaximized) {
      // If launched from tray, delay maximize to restore previous maximized state
      configManager.getLaunchToTray()
        ? mainWindow.once('show', () => {
            mainWindow.maximize()
          })
        : mainWindow.maximize()
    }
  }

  private setupContextMenu(mainWindow: BrowserWindow) {
    contextMenu.contextMenu(mainWindow)
    app.on('browser-window-created', (_, win) => {
      contextMenu.contextMenu(win)
    })

    // Dangerous API
    if (isDev) {
      mainWindow.webContents.on('will-attach-webview', (_, webPreferences) => {
        webPreferences.preload = join(__dirname, '../preload/index.js')
      })
    }
  }

  private setupWindowEvents(mainWindow: BrowserWindow) {
    mainWindow.once('ready-to-show', () => {
      mainWindow.webContents.setZoomFactor(configManager.getZoomFactor())

      // show window only when laucn to tray not set
      const isLaunchToTray = configManager.getLaunchToTray()
      if (!isLaunchToTray) {
        //[mac]hacky-fix: miniWindow set visibleOnFullScreen:true will cause dock icon disappeared
        app.dock?.show()
        mainWindow.show()
      }
    })

    // Handle fullscreen related events
    mainWindow.on('enter-full-screen', () => {
      mainWindow.webContents.send(IpcChannel.FullscreenStatusChanged, true)
    })

    mainWindow.on('leave-full-screen', () => {
      mainWindow.webContents.send(IpcChannel.FullscreenStatusChanged, false)
    })

    // set the zoom factor again when the window is going to resize
    //
    // this is a workaround for the known bug that
    // the zoom factor is reset to cached value when window is resized after routing to other page
    // see: https://github.com/electron/electron/issues/10572
    //
    mainWindow.on('will-resize', () => {
      mainWindow.webContents.setZoomFactor(configManager.getZoomFactor())
    })

    // ARCH: as `will-resize` is only for Win & Mac,
    // linux has the same problem, use `resize` listener instead
    // but `resize` will fliker the ui
    if (isLinux) {
      mainWindow.on('resize', () => {
        mainWindow.webContents.setZoomFactor(configManager.getZoomFactor())
      })
    }

    // Add support for exiting full screen with the Escape key
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Exit full screen when Escape key is pressed and the window is in full screen
      if (input.key === 'Escape' && !input.alt && !input.control && !input.meta && !input.shift) {
        if (mainWindow.isFullScreen()) {
          event.preventDefault()
          mainWindow.setFullScreen(false)
        }
      }
    })
  }

  private setupWebContentsHandlers(mainWindow: BrowserWindow) {
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url.includes('localhost:5173')) {
        return
      }

      event.preventDefault()
      shell.openExternal(url)
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      const { url } = details

      const oauthProviderUrls = [
        'https://account.siliconflow.cn/oauth',
        'https://cloud.siliconflow.cn/bills',
        'https://cloud.siliconflow.cn/expensebill',
        'https://aihubmix.com/token',
        'https://aihubmix.com/topup',
        'https://aihubmix.com/statistics'
      ]

      if (oauthProviderUrls.some((link) => url.startsWith(link))) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            webPreferences: {
              partition: 'persist:webview'
            }
          }
        }
      }

      if (url.includes('http://file/')) {
        const fileName = url.replace('http://file/', '')
        const storageDir = getFilesDir()
        const filePath = storageDir + '/' + fileName
        shell.openPath(filePath).catch((err) => Logger.error('Failed to open file:', err))
      } else {
        shell.openExternal(details.url)
      }

      return { action: 'deny' }
    })

    this.setupWebRequestHeaders(mainWindow)
  }

  private setupWebRequestHeaders(mainWindow: BrowserWindow) {
    mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
      if (details.responseHeaders?.['X-Frame-Options']) {
        delete details.responseHeaders['X-Frame-Options']
      }
      if (details.responseHeaders?.['x-frame-options']) {
        delete details.responseHeaders['x-frame-options']
      }
      if (details.responseHeaders?.['Content-Security-Policy']) {
        delete details.responseHeaders['Content-Security-Policy']
      }
      if (details.responseHeaders?.['content-security-policy']) {
        delete details.responseHeaders['content-security-policy']
      }
      callback({ cancel: false, responseHeaders: details.responseHeaders })
    })
  }

  private loadMainWindowContent(mainWindow: BrowserWindow) {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      // mainWindow.webContents.openDevTools()
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  private setupWindowLifecycleEvents(mainWindow: BrowserWindow) {
    mainWindow.on('close', (event) => {
      // If app quitting is already triggered, quit immediately
      if (app.isQuitting) {
        return app.quit()
      }

      // Tray and close behavior settings
      const isShowTray = configManager.getTray()
      const isTrayOnClose = configManager.getTrayOnClose()

      // If tray disabled, or tray enabled but close-to-tray disabled, quit directly
      if (!isShowTray || (isShowTray && !isTrayOnClose)) {
        // For Windows or Linux, quit the application
        if (isWin || isLinux) {
          return app.quit()
        }
      }

      /**
       * Following logic applies when tray is enabled and close-to-tray is set:
       * win/linux: minimize to tray on close
       * mac: always reach here, handle mac-specific behavior
       */

      event.preventDefault()

      mainWindow.hide()

      //for mac users, should hide dock icon if close to tray
      if (isMac && isTrayOnClose) {
        app.dock?.hide()
      }
    })

    mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    mainWindow.on('show', () => {
      if (this.miniWindow && !this.miniWindow.isDestroyed()) {
        this.miniWindow.hide()
      }
    })
  }

  public showMainWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.hide()
    }

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
        return
      }

      /**
       * About setVisibleOnAllWorkspaces
       *
       * [macOS] Known Issue
       *  setVisibleOnAllWorkspaces true/false will NOT bring window to current desktop in Mac (works fine with Windows)
       *  AppleScript may be a solution, but it's not worth
       *
       * [Linux] Known Issue
       *  setVisibleOnAllWorkspaces in Linux environment (especially KDE Wayland) will cause the window to enter a 'fake popup' state
       *  Therefore, these two lines of code are not executed in the Linux environment
       */
      if (!isLinux) {
        this.mainWindow.setVisibleOnAllWorkspaces(true)
      }

      /**
       * [macOS] After being closed in fullscreen, the fullscreen behavior will become strange when window shows again
       * So we need to set it to FALSE explicitly.
       * althougle other platforms don't have the issue, but it's a good practice to do so
       *
       *  Check if window is visible to prevent interrupting fullscreen state when clicking dock icon
       */
      if (this.mainWindow.isFullScreen() && !this.mainWindow.isVisible()) {
        this.mainWindow.setFullScreen(false)
      }

      this.mainWindow.show()
      this.mainWindow.focus()
      if (!isLinux) {
        this.mainWindow.setVisibleOnAllWorkspaces(false)
      }
    } else {
      this.mainWindow = this.createMainWindow()
    }
  }

  public toggleMainWindow() {
    // should not toggle main window when in full screen
    // but if the main window is close to tray when it's in full screen, we can show it again
    // (it's a bug in macos, because we can close the window when it's in full screen, and the state will be remained)
    if (this.mainWindow?.isFullScreen() && this.mainWindow?.isVisible()) {
      return
    }

    if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.isVisible()) {
      if (this.mainWindow.isFocused()) {
        // if tray is enabled, hide the main window, else do nothing
        if (configManager.getTray()) {
          this.mainWindow.hide()
          app.dock?.hide()
        }
      } else {
        this.mainWindow.focus()
      }
      return
    }

    this.showMainWindow()
  }

  public createMiniWindow(isPreload: boolean = false): BrowserWindow {
    this.miniWindow = new BrowserWindow({
      width: 550,
      height: 400,
      minWidth: 350,
      minHeight: 380,
      maxWidth: 1024,
      maxHeight: 768,
      show: false,
      autoHideMenuBar: true,
      transparent: isMac,
      vibrancy: 'under-window',
      visualEffectState: 'followWindow',
      center: true,
      frame: false,
      alwaysOnTop: true,
      resizable: true,
      useContentSize: true,
      ...(isMac ? { type: 'panel' } : {}),
      skipTaskbar: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        webSecurity: false,
        webviewTag: true,
        experimentalFeatures: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    //miniWindow should show in current desktop
    this.miniWindow?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    //make miniWindow always on top of fullscreen apps with level set
    //[mac] level higher than 'floating' will cover the pinyin input method
    this.miniWindow.setAlwaysOnTop(true, 'floating')

    this.miniWindow.on('ready-to-show', () => {
      if (isPreload) {
        return
      }

      this.wasMainWindowFocused = this.mainWindow?.isFocused() || false
      this.miniWindow?.center()
      this.miniWindow?.show()
    })

    this.miniWindow.on('blur', () => {
      if (!this.isPinnedMiniWindow) {
        this.hideMiniWindow()
      }
    })

    this.miniWindow.on('closed', () => {
      this.miniWindow = null
    })

    this.miniWindow.on('hide', () => {
      this.miniWindow?.webContents.send(IpcChannel.HideMiniWindow)
    })

    this.miniWindow.on('show', () => {
      this.miniWindow?.webContents.send(IpcChannel.ShowMiniWindow)
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.miniWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/miniWindow.html')
    } else {
      this.miniWindow.loadFile(join(__dirname, '../renderer/miniWindow.html'))
    }

    return this.miniWindow
  }

  public showMiniWindow() {
    const enableQuickAssistant = configManager.getEnableQuickAssistant()

    if (!enableQuickAssistant) {
      return
    }

    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.wasMainWindowFocused = this.mainWindow?.isFocused() || false

      if (this.miniWindow.isMinimized()) {
        this.miniWindow.restore()
      }
      this.miniWindow.show()
      return
    }

    this.miniWindow = this.createMiniWindow()
  }

  public hideMiniWindow() {
    //hacky-fix:[mac/win] previous window(not self-app) should be focused again after miniWindow hide
    if (isWin) {
      this.miniWindow?.minimize()
      this.miniWindow?.hide()
      return
    } else if (isMac) {
      this.miniWindow?.hide()
      if (!this.wasMainWindowFocused) {
        app.hide()
      }
      return
    }

    this.miniWindow?.hide()
  }

  public closeMiniWindow() {
    this.miniWindow?.close()
  }

  public toggleMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed() && this.miniWindow.isVisible()) {
      this.hideMiniWindow()
      return
    }

    this.showMiniWindow()
  }

  public setPinMiniWindow(isPinned) {
    this.isPinnedMiniWindow = isPinned
  }
}

export const windowService = WindowService.getInstance()
