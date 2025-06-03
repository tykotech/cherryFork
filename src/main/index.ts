import { electronApp, optimizer } from '@electron-toolkit/utils'
import { replaceDevtoolsFont } from '@main/utils/windowUtil'
import { IpcChannel } from '@shared/IpcChannel'
import { app, BrowserWindow, ipcMain } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer'
import Logger from 'electron-log'

import { registerIpc } from './ipc'
import { configManager } from './services/ConfigManager'
import mcpService from './services/MCPService'
import {
  CHERRY_STUDIO_PROTOCOL,
  handleProtocolUrl,
  registerProtocolClient,
  setupAppImageDeepLink
} from './services/ProtocolClient'
import { registerShortcuts } from './services/ShortcutService'
import { TrayService } from './services/TrayService'
import { windowService } from './services/WindowService'
import { setUserDataDir } from './utils/file'

Logger.initialize()

// Fix DevTools autofill errors by disabling problematic features
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor,Autofill')
app.commandLine.appendSwitch('--disable-dev-shm-usage')
app.commandLine.appendSwitch('--disable-background-timer-throttling')
app.commandLine.appendSwitch('--disable-renderer-backgrounding')
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows')

// Suppress DevTools protocol error logging
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (
    message.includes('Autofill.enable') ||
    message.includes('Autofill.setAddresses') ||
    message.includes('Protocol error') ||
    (message.includes('DevTools') && message.includes('not supported'))
  ) {
    return // Suppress these specific errors
  }
  originalConsoleError.apply(console, args)
}

// Check for single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId(import.meta.env.VITE_MAIN_BUNDLE_ID || 'com.kangfenmao.TykoTechFork')

    // Mac: Hide dock icon before window creation when launch to tray is set
    const isLaunchToTray = configManager.getLaunchToTray()
    if (isLaunchToTray) {
      app.dock?.hide()
    }

    const mainWindow = windowService.createMainWindow()

    // Suppress DevTools autofill and protocol errors
    if (mainWindow) {
      mainWindow.webContents.on('did-finish-load', () => {
        // Inject error suppression script
        mainWindow.webContents
          .executeJavaScript(
            `
            // Suppress DevTools console errors for autofill and other unsupported features
            const originalConsoleError = console.error;
            const originalConsoleWarn = console.warn;
            
            console.error = function(...args) {
              const message = args.join(' ');
              // Skip autofill related errors
              if (message.includes('Autofill.enable') || 
                  message.includes('Autofill.setAddresses') ||
                  message.includes('Protocol error') ||
                  message.includes('DevTools') && message.includes('not supported')) {
                return;
              }
              originalConsoleError.apply(console, args);
            };
            
            console.warn = function(...args) {
              const message = args.join(' ');
              // Skip autofill related warnings
              if (message.includes('Autofill') || 
                  message.includes('DevTools protocol')) {
                return;
              }
              originalConsoleWarn.apply(console, args);
            };
          `
          )
          .catch(() => {
            // Silently ignore injection errors
          })
      })

      // Handle DevTools opened event
      mainWindow.webContents.on('devtools-opened', () => {
        // Additional error suppression when DevTools is opened
        mainWindow.webContents.devToolsWebContents
          ?.executeJavaScript(
            `
            // Suppress DevTools-specific errors
            const originalError = console.error;
            console.error = function(...args) {
              const message = args.join(' ');
              if (message.includes('Autofill') || 
                  message.includes('Protocol error') ||
                  message.includes('not supported in Electron')) {
                return;
              }
              originalError.apply(console, args);
            };
          `
          )
          .catch(() => {
            // Silently ignore DevTools injection errors
          })
      })
    }

    new TrayService()

    app.on('activate', function () {
      const mainWindow = windowService.getMainWindow()
      if (!mainWindow || mainWindow.isDestroyed()) {
        windowService.createMainWindow()
      } else {
        windowService.showMainWindow()
      }
    })

    registerShortcuts(mainWindow)

    registerIpc(mainWindow, app)

    replaceDevtoolsFont(mainWindow)

    setUserDataDir()

    // Setup deep link for AppImage on Linux
    await setupAppImageDeepLink()

    if (process.env.NODE_ENV === 'development') {
      installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err))
    }
    ipcMain.handle(IpcChannel.System_GetDeviceType, () => {
      return process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'windows' : 'linux'
    })

    ipcMain.handle(IpcChannel.System_GetHostname, () => {
      return require('os').hostname()
    })

    ipcMain.handle(IpcChannel.System_ToggleDevTools, (e) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      win && win.webContents.toggleDevTools()
    })
  })

  registerProtocolClient(app)

  // macOS specific: handle protocol when app is already running
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleProtocolUrl(url)
  })

  // Listen for second instance
  app.on('second-instance', (_event, argv) => {
    windowService.showMainWindow()

    // Protocol handler for Windows/Linux
    // The commandLine is an array of strings where the last item might be the URL
    const url = argv.find((arg) => arg.startsWith(CHERRY_STUDIO_PROTOCOL + '://'))
    if (url) handleProtocolUrl(url)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })

  app.on('will-quit', async () => {
    // event.preventDefault()
    try {
      await mcpService.cleanup()
      app.exit(0)
    } catch (error) {
      Logger.error('Error cleaning up MCP service:', error)
      app.exit(1)
    }
  })

  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.
}
