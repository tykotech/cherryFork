const fs = require('fs')
const csv = require('csv-parser')
const sqlite3 = require('sqlite3').verbose()

// Connect to the SQLite database
const db = new sqlite3.Database('./data/CherryStudio.sqlite3', (err) => {
  if (err) {
    console.error('Error opening database', err)
    return
  }
  console.log('Connected to the SQLite database.')
})

// Create an array to store CSV data
const results = []

// Read the CSV file
fs.createReadStream('./data/data.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Prepare SQL insert statement, using INSERT OR IGNORE
    const stmt = db.prepare('INSERT OR IGNORE INTO emails (email, github, sent) VALUES (?, ?, ?)')

    // Insert each row of data
    let inserted = 0
    let skipped = 0
    let emptyEmail = 0

    db.serialize(() => {
      // Begin a transaction to improve performance
      db.run('BEGIN TRANSACTION')

      results.forEach((row) => {
        // Check if email is empty
        if (!row.email || row.email.trim() === '') {
          emptyEmail++
          return // Skip this row
        }

        stmt.run(row.email, row['user-href'], 0, function (err) {
          if (err) {
            console.error('Error inserting row', err)
          } else {
            if (this.changes === 1) {
              inserted++
            } else {
              skipped++
            }
          }
        })
      })

      // Commit the transaction
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction', err)
        } else {
          console.log(
            `Insertion complete. Inserted: ${inserted}, Skipped (duplicate): ${skipped}, Skipped (empty email): ${emptyEmail}`
          )
        }

        // Finish insertion
        stmt.finalize()

        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database', err)
          } else {
            console.log('Database connection closed.')
          }
        })
      })
    })
  })
