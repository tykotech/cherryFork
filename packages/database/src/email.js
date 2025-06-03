const sqlite3 = require('sqlite3').verbose()

// Connect to the database
const db = new sqlite3.Database('./data/CherryStudio.sqlite3', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message)
    return
  }
})

// Query data and convert to JSON
db.all('SELECT * FROM emails WHERE sent = 0', [], (err, rows) => {
  if (err) {
    console.error('Error querying the database:', err.message)
    return
  }

  for (const row of rows) {
    console.log(row.email)
    // Update row set sent = 1
    db.run('UPDATE emails SET sent = 1 WHERE id = ?', [row.id], (err) => {
      if (err) {
        console.error('Error updating the database:', err.message)
        return
      }
    })
  }

  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err.message)
      return
    }
  })
})
