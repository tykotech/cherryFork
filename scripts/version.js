const { execSync } = require('child_process')
const fs = require('fs')

// Execute a command and return its output
function exec(command) {
  return execSync(command, { encoding: 'utf8' }).trim()
}

// Get command line arguments
const args = process.argv.slice(2)
const versionType = args[0] || 'patch'
const shouldPush = args.includes('push')

// Validate version type
if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('Invalid version type. Use patch, minor, or major.')
  process.exit(1)
}

// Update version
exec(`yarn version ${versionType} --immediate`)

// Read the updated package.json to get the new version number
const updatedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const newVersion = updatedPackageJson.version

// Git operations
exec('git add .')
exec(`git commit -m "chore(version): ${newVersion}"`)
exec(`git tag -a v${newVersion} -m "Version ${newVersion}"`)

console.log(`Version bumped to ${newVersion}`)

if (shouldPush) {
  console.log('Pushing to remote...')
  exec('git push && git push --tags')
  console.log('Pushed to remote.')
} else {
  console.log('Changes are committed locally. Use "git push && git push --tags" to push to remote.')
}
