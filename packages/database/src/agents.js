const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')

// Connect to the database
const db = new sqlite3.Database('./data/CherryStudio.sqlite3', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message)
    return
  }
  console.log('Connected to the database.')
})

// Query data and convert to JSON
db.all('SELECT * FROM agents', [], (err, rows) => {
  if (err) {
    console.error('Error querying the database:', err.message)
    return
  }

  // Convert ID type to string
  for (const row of rows) {
    row.id = row.id.toString()
    row.group = row.group.toString().split(',')
    row.group = row.group.map((item) => item.trim().replace('\r\n', ''))
  }

  // Convert query result to JSON string
  const jsonData = JSON.stringify(rows, null, 2)

  // Write JSON data to file
  fs.writeFile('../../src/renderer/src/config/agents.json', jsonData, (err) => {
    if (err) {
      console.error('Error writing to file:', err.message)
      return
    }
    console.log('Data has been written to agents.json')
  })

  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err.message)
      return
    }
    console.log('Database connection closed.')
  })
})
