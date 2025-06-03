import { app } from 'electron'
import Logger from 'electron-log'
import fs from 'fs'
import path from 'path'

interface VaultInfo {
  path: string
  name: string
}

interface FileInfo {
  path: string
  type: 'folder' | 'markdown'
  name: string
}

class ObsidianVaultService {
  private obsidianConfigPath: string

  constructor() {
    // Get Obsidian config file path based on OS
    if (process.platform === 'win32') {
      this.obsidianConfigPath = path.join(app.getPath('appData'), 'obsidian', 'obsidian.json')
    } else if (process.platform === 'darwin') {
      this.obsidianConfigPath = path.join(
        app.getPath('home'),
        'Library',
        'Application Support',
        'obsidian',
        'obsidian.json'
      )
    } else {
      // Linux
      this.obsidianConfigPath = path.join(app.getPath('home'), '.config', 'obsidian', 'obsidian.json')
    }
  }

  /**
   * Get all Obsidian Vaults
   */
  getVaults(): VaultInfo[] {
    try {
      if (!fs.existsSync(this.obsidianConfigPath)) {
        return []
      }

      const configContent = fs.readFileSync(this.obsidianConfigPath, 'utf8')
      const config = JSON.parse(configContent)

      if (!config.vaults) {
        return []
      }

      return Object.entries(config.vaults).map(([, vault]: [string, any]) => ({
        path: vault.path,
        name: vault.name || path.basename(vault.path)
      }))
    } catch (error) {
      console.error('Failed to get Obsidian Vaults:', error)
      return []
    }
  }

  /**
   * Get folder and Markdown file structure in a Vault
   */
  getVaultStructure(vaultPath: string): FileInfo[] {
    const results: FileInfo[] = []

    try {
      // Check if vault path exists
      if (!fs.existsSync(vaultPath)) {
        console.error('Vault path does not exist:', vaultPath)
        return []
      }

      // Check if it is a directory
      const stats = fs.statSync(vaultPath)
      if (!stats.isDirectory()) {
        console.error('Vault path is not a directory:', vaultPath)
        return []
      }

      this.traverseDirectory(vaultPath, '', results)
    } catch (error) {
      console.error('Failed to read Vault folder structure:', error)
    }

    return results
  }

  /**
   * Recursively traverse directory to get all folders and Markdown files
   */
  private traverseDirectory(dirPath: string, relativePath: string, results: FileInfo[]) {
    try {
      // Add current folder first
      if (relativePath) {
        results.push({
          path: relativePath,
          type: 'folder',
          name: path.basename(relativePath)
        })
      }

      // Ensure directory exists and is accessible
      if (!fs.existsSync(dirPath)) {
        console.error('Directory does not exist:', dirPath)
        return
      }

      let items
      try {
        items = fs.readdirSync(dirPath, { withFileTypes: true })
      } catch (err) {
        console.error(`Cannot read directory ${dirPath}:`, err)
        return
      }

      for (const item of items) {
        // Ignore hidden folders and files starting with .
        if (item.name.startsWith('.')) {
          continue
        }

        const newRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name
        const fullPath = path.join(dirPath, item.name)

        if (item.isDirectory()) {
          this.traverseDirectory(fullPath, newRelativePath, results)
        } else if (item.isFile() && item.name.endsWith('.md')) {
          // Collect .md files
          results.push({
            path: newRelativePath,
            type: 'markdown',
            name: item.name
          })
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${dirPath}:`, error)
    }
  }

  /**
   * Get folder and Markdown file structure for a specified Vault
   * @param vaultName Vault name
   */
  getFilesByVaultName(vaultName: string): FileInfo[] {
    try {
      const vaults = this.getVaults()
      const vault = vaults.find((v) => v.name === vaultName)

      if (!vault) {
        console.error('Vault with specified name not found:', vaultName)
        return []
      }

      Logger.log('Getting Vault file structure:', vault.name, vault.path)
      return this.getVaultStructure(vault.path)
    } catch (error) {
      console.error('Error getting Vault file structure:', error)
      return []
    }
  }
}

export default ObsidianVaultService
