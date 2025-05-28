import sqlite3 from 'sqlite3';
import path from 'path';

const DB_FILE_NAME = 'dev.sqlite3';
// Resolve the database path relative to the project root (backend directory)
const DB_PATH = path.resolve(__dirname, `../../${DB_FILE_NAME}`);

let db: sqlite3.Database | null = null;

export const getDB = (): sqlite3.Database => {
  if (!db) {
    // Use verbose mode for more detailed stack traces
    const sqlite = sqlite3.verbose();
    db = new sqlite.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite:', err.message);
        // Optionally, you could throw the error or exit the application
        // throw err;
      } else {
        console.log(`Connected to SQLite database at ${DB_PATH}`);
        // You can create tables here if they don't exist, e.g.:
        // db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
      }
    });
  }
  return db;
};

// Initialize DB connection when module is loaded
// This ensures the DB is connected (or connection is attempted) when this module is imported.
// If you prefer to connect on first query, you can remove this line.
getDB();
