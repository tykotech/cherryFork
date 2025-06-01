// Script to initialize required application files
const fs = require('fs')
const path = require('path')
const os = require('os')

// Define app data paths - match the app's expected paths
const appName = 'tykostudio'
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', appName)
const dataFilesPath = path.join(appDataPath, 'Data', 'Files')

// Create required directories with error handling
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 })
      console.log(`Created directory: ${dirPath}`)
    } else {
      console.log(`Directory already exists: ${dirPath}`)
    }
    return true
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error)
    return false
  }
}

// Create required directories
console.log('Initializing application directories...')
const dirsCreated = [
  ensureDirectoryExists(appDataPath), ensureDirectoryExists(dataFilesPath)]

if (dirsCreated.every(Boolean)) {
  console.log('All directories verified/created successfully')
} else {
  console.error('Failed to create one or more directories')
}

// Ensure custom-minapps.json exists with proper content
const customMinAppsPath = path.join(dataFilesPath, 'custom-minapps.json')
try {
  if (!fs.existsSync(customMinAppsPath)) {
    const defaultContent = JSON.stringify([], null, 2)
    fs.writeFileSync(customMinAppsPath, defaultContent, 'utf8')
    console.log(`Created file: ${customMinAppsPath}`)
    
    // Verify the file was created
    if (fs.existsSync(customMinAppsPath)) {
      const stats = fs.statSync(customMinAppsPath)
      console.log(`File created successfully. Size: ${stats.size} bytes`)
    } else {
      throw new Error('File creation verification failed')
    }
  } else {
    console.log(`File already exists: ${customMinAppsPath}`)
    
    // Verify the file is readable and valid JSON
    try {
      const content = fs.readFileSync(customMinAppsPath, 'utf8')
      JSON.parse(content) // Will throw if not valid JSON
      console.log('File contains valid JSON')
    } catch (error) {
      console.error('Existing file is not valid JSON, resetting...', error)
      fs.writeFileSync(customMinAppsPath, JSON.stringify([], null, 2), 'utf8')
      console.log('Reset file with empty array')
    }
  }
} catch (error) {
  console.error('Failed to initialize custom-minapps.json:', error)
  process.exit(1)
}

console.log('Application files initialization complete.')
