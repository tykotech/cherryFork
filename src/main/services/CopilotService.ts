import { AxiosRequestConfig } from 'axios'
import { app, safeStorage } from 'electron'
import Logger from 'electron-log'
import fs from 'fs/promises'
import path from 'path'

import aoxisProxy from './AxiosProxy'

// Configuration constants, centralized management
const CONFIG = {
  GITHUB_CLIENT_ID: 'Iv1.b507a08c87ecfe98',
  POLLING: {
    MAX_ATTEMPTS: 8,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 16000 // Max delay 16 seconds
  },
  DEFAULT_HEADERS: {
    accept: 'application/json',
    'editor-version': 'Neovim/0.6.1',
    'editor-plugin-version': 'copilot.vim/1.16.0',
    'content-type': 'application/json',
    'user-agent': 'GithubCopilot/1.155.0',
    'accept-encoding': 'gzip,deflate,br'
  },
  // API endpoints centralized
  API_URLS: {
    GITHUB_USER: 'https://api.github.com/user',
    GITHUB_DEVICE_CODE: 'https://github.com/login/device/code',
    GITHUB_ACCESS_TOKEN: 'https://github.com/login/oauth/access_token',
    COPILOT_TOKEN: 'https://api.github.com/copilot_internal/v2/token'
  }
}

// Move interface definitions to the top for easy reference
interface UserResponse {
  login: string
  avatar: string
}

interface AuthResponse {
  device_code: string
  user_code: string
  verification_uri: string
}

interface TokenResponse {
  access_token: string
}

interface CopilotTokenResponse {
  token: string
}

// Custom error class for unified error handling
class CopilotServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'CopilotServiceError'
  }
}

class CopilotService {
  private readonly tokenFilePath: string
  private headers: Record<string, string>

  constructor() {
    this.tokenFilePath = path.join(app.getPath('userData'), '.copilot_token')
    this.headers = { ...CONFIG.DEFAULT_HEADERS }
  }

  /**
   * Set custom request headers
   */
  private updateHeaders = (headers?: Record<string, string>): void => {
    if (headers && Object.keys(headers).length > 0) {
      this.headers = { ...headers }
    }
  }

  /**
   * Get GitHub login info
   */
  public getUser = async (_: Electron.IpcMainInvokeEvent, token: string): Promise<UserResponse> => {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Connection: 'keep-alive',
          'user-agent': 'Visual Studio Code (desktop)',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Dest': 'empty',
          authorization: `token ${token}`
        }
      }

      const response = await aoxisProxy.axios.get(CONFIG.API_URLS.GITHUB_USER, config)
      return {
        login: response.data.login,
        avatar: response.data.avatar_url
      }
    } catch (error) {
      console.error('Failed to get user information:', error)
      throw new CopilotServiceError('Failed to get GitHub user info', error)
    }
  }

  /**
   * Get GitHub device authorization info
   */
  public getAuthMessage = async (
    _: Electron.IpcMainInvokeEvent,
    headers?: Record<string, string>
  ): Promise<AuthResponse> => {
    try {
      this.updateHeaders(headers)

      const response = await aoxisProxy.axios.post<AuthResponse>(
        CONFIG.API_URLS.GITHUB_DEVICE_CODE,
        {
          client_id: CONFIG.GITHUB_CLIENT_ID,
          scope: 'read:user'
        },
        { headers: this.headers }
      )

      return response.data
    } catch (error) {
      console.error('Failed to get auth message:', error)
      throw new CopilotServiceError('Failed to get GitHub authorization info', error)
    }
  }

  /**
   * Use device code to get access token - improved polling logic
   */
  public getCopilotToken = async (
    _: Electron.IpcMainInvokeEvent,
    device_code: string,
    headers?: Record<string, string>
  ): Promise<TokenResponse> => {
    this.updateHeaders(headers)

    let currentDelay = CONFIG.POLLING.INITIAL_DELAY_MS

    for (let attempt = 0; attempt < CONFIG.POLLING.MAX_ATTEMPTS; attempt++) {
      await this.delay(currentDelay)

      try {
        const response = await aoxisProxy.axios.post<TokenResponse>(
          CONFIG.API_URLS.GITHUB_ACCESS_TOKEN,
          {
            client_id: CONFIG.GITHUB_CLIENT_ID,
            device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          },
          { headers: this.headers }
        )

        const { access_token } = response.data
        if (access_token) {
          return { access_token }
        }
      } catch (error) {
        // Exponential backoff
        currentDelay = Math.min(currentDelay * 2, CONFIG.POLLING.MAX_DELAY_MS)

        // Only log detailed error on last attempt
        const isLastAttempt = attempt === CONFIG.POLLING.MAX_ATTEMPTS - 1
        if (isLastAttempt) {
          console.error(`Token polling failed after ${CONFIG.POLLING.MAX_ATTEMPTS} attempts:`, error)
        }
      }
    }

    throw new CopilotServiceError('Timeout getting access token, please try again')
  }

  /**
   * Save Copilot token to local file
   */
  public saveCopilotToken = async (_: Electron.IpcMainInvokeEvent, token: string): Promise<void> => {
    try {
      const encryptedToken = safeStorage.encryptString(token)
      await fs.writeFile(this.tokenFilePath, encryptedToken)
    } catch (error) {
      console.error('Failed to save token:', error)
      throw new CopilotServiceError('Failed to save access token', error)
    }
  }

  /**
   * Read token from local file and get Copilot token
   */
  public getToken = async (
    _: Electron.IpcMainInvokeEvent,
    headers?: Record<string, string>
  ): Promise<CopilotTokenResponse> => {
    try {
      this.updateHeaders(headers)

      const encryptedToken = await fs.readFile(this.tokenFilePath)
      const access_token = safeStorage.decryptString(Buffer.from(encryptedToken))

      const config: AxiosRequestConfig = {
        headers: {
          ...this.headers,
          authorization: `token ${access_token}`
        }
      }

      const response = await aoxisProxy.axios.get<CopilotTokenResponse>(CONFIG.API_URLS.COPILOT_TOKEN, config)

      return response.data
    } catch (error) {
      console.error('Failed to get Copilot token:', error)
      throw new CopilotServiceError('Failed to get Copilot token, please re-authorize', error)
    }
  }

  /**
   * Logout, delete local token file
   */
  public logout = async (): Promise<void> => {
    try {
      try {
        await fs.access(this.tokenFilePath)
        await fs.unlink(this.tokenFilePath)
        Logger.log('Successfully logged out from Copilot')
      } catch (error) {
        // File not found is not an error, just log
        Logger.log('Token file not found, nothing to delete')
      }
    } catch (error) {
      console.error('Failed to logout:', error)
      throw new CopilotServiceError('Failed to complete logout operation', error)
    }
  }

  /**
   * Helper method: delay execution
   */
  private delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export default new CopilotService()
