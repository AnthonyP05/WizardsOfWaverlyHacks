/**
 * SQLite Database Connection
 * 
 * Uses better-sqlite3 for a file-based database that runs anywhere —
 * no MySQL install needed. The DB file is created automatically.
 * 
 * The database file lives at ./data/recyclelocal.db
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'recyclelocal.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create users table if it doesn't exist (auto-setup on first run)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    zip_code TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

// Quick connectivity test
function testConnection() {
  try {
    db.prepare('SELECT 1').get();
    console.log('   ✅ SQLite connected (data/recyclelocal.db)');
    return true;
  } catch (err) {
    console.error('   ❌ SQLite error:', err.message);
    return false;
  }
}

module.exports = { db, testConnection };
