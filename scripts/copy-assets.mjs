import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

// Copy icon assets from build to dist/icons
const iconsSrc = path.join(rootDir, 'build')
const iconsDest = path.join(distDir, 'icons')
fs.ensureDirSync(iconsDest)
const iconFiles = ['icon.png', 'icon.ico', 'icon.icns', 'tray_icon.png', 'tray_icon_dark.png', 'tray_icon_light.png']
iconFiles.forEach((file) => {
  const src = path.join(iconsSrc, file)
  if (fs.existsSync(src)) {
    fs.copySync(src, path.join(iconsDest, file))
  }
})

// Copy preload scripts
const preloadSrc = path.join(rootDir, 'src', 'preload')
const preloadDest = path.join(distDir, 'preload')
if (fs.existsSync(preloadSrc)) {
  fs.ensureDirSync(preloadDest)
  fs.copySync(preloadSrc, preloadDest, { overwrite: true })
}

console.log('Assets copied to dist directory')
