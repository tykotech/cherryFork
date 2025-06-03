import { IpcChannel } from '@shared/IpcChannel'
import { ipcMain } from 'electron'
import { EventEmitter } from 'events'

import { windowService } from './WindowService'

type StoreValue = any
type Unsubscribe = () => void

export class ReduxService extends EventEmitter {
  private stateCache: any = {}
  private isReady = false

  private readonly STATUS_CHANGE_EVENT = 'statusChange'

  constructor() {
    super()
    this.setupIpcHandlers()
  }

  private setupIpcHandlers() {
    // Listen for store ready event
    ipcMain.handle(IpcChannel.ReduxStoreReady, () => {
      this.isReady = true
      this.emit('ready')
    })

    // Listen for store state changes
    ipcMain.on(IpcChannel.ReduxStateChange, (_, newState) => {
      this.stateCache = newState
      this.emit(this.STATUS_CHANGE_EVENT, newState)
    })
  }

  private async waitForStoreReady(webContents: Electron.WebContents, timeout = 10000): Promise<void> {
    if (this.isReady) return

    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      try {
        const isReady = await webContents.executeJavaScript(`
          !!window.store && typeof window.store.getState === 'function'
        `)
        if (isReady) {
          this.isReady = true
          return
        }
      } catch (error) {
        // Ignore error, keep waiting
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('Timeout waiting for Redux store to be ready')
  }

  // Add method to get state synchronously
  getStateSync() {
    return this.stateCache
  }

  // Add synchronous selector method
  selectSync<T = StoreValue>(selector: string): T | undefined {
    try {
      // Use Function constructor to safely execute selector
      const selectorFn = new Function('state', `return ${selector}`)
      return selectorFn(this.stateCache)
    } catch (error) {
      console.error('Failed to select from cache:', error)
      return undefined
    }
  }

  // Modify select method to prefer cache
  async select<T = StoreValue>(selector: string): Promise<T> {
    try {
      // If ready, try to get from cache first
      if (this.isReady) {
        const cachedValue = this.selectSync<T>(selector)
        if (cachedValue !== undefined) {
          return cachedValue
        }
      }

      // If not in cache, get from renderer process
      const mainWindow = windowService.getMainWindow()
      if (!mainWindow) {
        throw new Error('Main window is not available')
      }
      await this.waitForStoreReady(mainWindow.webContents)
      return await mainWindow.webContents.executeJavaScript(`
        (() => {
          const state = window.store.getState();
          return ${selector};
        })()
      `)
    } catch (error) {
      console.error('Failed to select store value:', error)
      throw error
    }
  }

  // Dispatch action
  async dispatch(action: any): Promise<void> {
    const mainWindow = windowService.getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }
    await this.waitForStoreReady(mainWindow.webContents)
    try {
      await mainWindow.webContents.executeJavaScript(`
        window.store.dispatch(${JSON.stringify(action)})
      `)
    } catch (error) {
      console.error('Failed to dispatch action:', error)
      throw error
    }
  }

  // Subscribe to state changes
  async subscribe(selector: string, callback: (newValue: any) => void): Promise<Unsubscribe> {
    const mainWindow = windowService.getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }
    await this.waitForStoreReady(mainWindow.webContents)

    // Set up listener in renderer process
    await mainWindow.webContents.executeJavaScript(
      `
      if (!window._storeSubscriptions) {
        window._storeSubscriptions = new Set();

        // Set up global state change listener
        const unsubscribe = window.store.subscribe(() => {
          const state = window.store.getState();
          window.electron.ipcRenderer.send('` +
        IpcChannel.ReduxStateChange +
        `', state);
        });

        window._storeSubscriptions.add(unsubscribe);
      }
    `
    )

    // Handle callback in main process
    const handler = async () => {
      try {
        const newValue = await this.select(selector)
        callback(newValue)
      } catch (error) {
        console.error('Error in subscription handler:', error)
      }
    }

    this.on(this.STATUS_CHANGE_EVENT, handler)
    return () => {
      this.off(this.STATUS_CHANGE_EVENT, handler)
    }
  }

  // Get entire state tree
  async getState(): Promise<any> {
    const mainWindow = windowService.getMainWindow()
    if (!mainWindow) {
      throw new Error('Main window is not available')
    }
    await this.waitForStoreReady(mainWindow.webContents)
    try {
      return await mainWindow.webContents.executeJavaScript(`
        window.store.getState()
      `)
    } catch (error) {
      console.error('Failed to get state:', error)
      throw error
    }
  }

  // Batch execute actions
  async batch(actions: any[]): Promise<void> {
    for (const action of actions) {
      await this.dispatch(action)
    }
  }
}

export const reduxService = new ReduxService()

/** example
 async function example() {
 try {
 // Read state
 const settings = await reduxService.select('state.settings')
 Logger.log('settings', settings)

 // Dispatch action
 await reduxService.dispatch({
 type: 'settings/updateApiKey',
 payload: 'new-api-key'
 })

 // Subscribe to state changes
 const unsubscribe = await reduxService.subscribe('state.settings.apiKey', (newValue) => {
 Logger.log('API key changed:', newValue)
 })

 // Batch execute actions
 await reduxService.batch([
 { type: 'action1', payload: 'data1' },
 { type: 'action2', payload: 'data2' }
 ])

 // Synchronous method may not have the latest data, but is faster
 const apiKey = reduxService.selectSync('state.settings.apiKey')
 Logger.log('apiKey', apiKey)

 // Asynchronous method ensures the latest data
 const apiKey1 = await reduxService.select('state.settings.apiKey')
 Logger.log('apiKey1', apiKey1)

 // Unsubscribe
 unsubscribe()
 } catch (error) {
 Logger.error('Error:', error)
 }
 }
 */
