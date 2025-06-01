import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Source and destination paths
const srcDir = path.join(__dirname, '..', 'resources')
const destDir = path.join(__dirname, '..', 'dist', 'resources')

// Ensure the destination directory exists
fs.ensureDirSync(destDir)

// Copy the resources directory
fs.copySync(srcDir, destDir, { overwrite: true })

console.log('Resources copied successfully!')
