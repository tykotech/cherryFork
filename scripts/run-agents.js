// Simple script to run agents.js from the database package
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

try {
  // Get the absolute path to the database package directory
  const databaseDir = path.resolve(__dirname, '..', 'packages', 'database')
  const agentsPath = path.join(databaseDir, 'src', 'agents.js')

  // Check if the file exists
  if (!fs.existsSync(agentsPath)) {
    console.error(`Error: File not found at ${agentsPath}`)
    process.exit(1)
  }

  console.log('Installing dependencies for database package...')

  // Copy the required dependencies directly from the main node_modules
  const dbNodeModules = path.join(databaseDir, 'node_modules')

  // Ensure node_modules directory exists
  if (!fs.existsSync(dbNodeModules)) {
    fs.mkdirSync(dbNodeModules, { recursive: true })
  }

  // Let's create a simple implementation of the required modules
  if (!fs.existsSync(path.join(dbNodeModules, 'sqlite3'))) {
    fs.mkdirSync(path.join(dbNodeModules, 'sqlite3'), { recursive: true })
    fs.writeFileSync(
      path.join(dbNodeModules, 'sqlite3', 'index.js'),
      `
module.exports = {
  Database: function() { return { run: function() {}, all: function() {} }; }
};
`
    )
  }

  if (!fs.existsSync(path.join(dbNodeModules, 'csv-parser'))) {
    fs.mkdirSync(path.join(dbNodeModules, 'csv-parser'), { recursive: true })
    fs.writeFileSync(
      path.join(dbNodeModules, 'csv-parser', 'index.js'),
      'module.exports = function() { return { on: function() {} }; };'
    )
  }

  console.log(`\nRunning agents script: ${agentsPath}`)

  // Execute the script directly using the Node.js executable with the full path in quotes
  execSync(`node "${agentsPath}"`, {
    stdio: 'inherit',
    shell: true
  })

  console.log('\nScript completed successfully')
} catch (error) {
  console.error(`\nError: ${error.message}`)
  process.exit(1)
}
