const { Arch } = require('electron-builder')
const fs = require('fs')
const path = require('path')

exports.default = async function (context) {
  const platform = context.packager.platform.name
  const arch = context.arch

  if (platform === 'mac') {
    const node_modules_path = path.join(
      context.appOutDir,
      'TykoTech Fork.app',
      'Contents',
      'Resources',
      'app.asar.unpacked',
      'node_modules'
    )

    // Use node_modules files for the specified architecture
    keepPackageNodeFiles(node_modules_path, '@libsql', arch === Arch.arm64 ? ['darwin-arm64'] : ['darwin-x64'])
  }

  if (platform === 'linux') {
    const node_modules_path = path.join(context.appOutDir, 'resources', 'app.asar.unpacked', 'node_modules')
    const _arch = arch === Arch.arm64 ? ['linux-arm64-gnu', 'linux-arm64-musl'] : ['linux-x64-gnu', 'linux-x64-musl']
    // Use node_modules files for the specified architecture
    keepPackageNodeFiles(node_modules_path, '@libsql', _arch)
  }

  if (platform === 'windows') {
    const node_modules_path = path.join(context.appOutDir, 'resources', 'app.asar.unpacked', 'node_modules')
    if (arch === Arch.arm64) {
      // Use node_modules files for the specified architecture
      keepPackageNodeFiles(node_modules_path, '@strongtz', ['win32-arm64-msvc'])
      keepPackageNodeFiles(node_modules_path, '@libsql', ['win32-arm64-msvc'])
    }
    if (arch === Arch.x64) {
      // Use node_modules files for the specified architecture
      keepPackageNodeFiles(node_modules_path, '@strongtz', ['win32-x64-msvc'])
      keepPackageNodeFiles(node_modules_path, '@libsql', ['win32-x64-msvc'])
    }
  }
}

/**
 * Use node_modules files for the specified architecture
 * @param {*} nodeModulesPath
 * @param {*} packageName
 * @param {*} arch
 * @returns
 */
function keepPackageNodeFiles(nodeModulesPath, packageName, arch) {
  const modulePath = path.join(nodeModulesPath, packageName)

  if (!fs.existsSync(modulePath)) {
    console.log(`[After Pack] Directory does not exist: ${modulePath}`)
    return
  }

  const dirs = fs.readdirSync(modulePath)
  dirs
    .filter((dir) => !arch.includes(dir))
    .forEach((dir) => {
      fs.rmSync(path.join(modulePath, dir), { recursive: true, force: true })
      console.log(`[After Pack] Removed dir: ${dir}`, arch)
    })
}
