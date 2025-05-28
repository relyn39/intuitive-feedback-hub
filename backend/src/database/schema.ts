import { getDB } from './sqlite'; // Assuming sqlite.ts is in the same directory

export const initializeTables = (): Promise<void> => {
  const db = getDB();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS feedback (
          id TEXT PRIMARY KEY,
          createdAt TEXT NOT NULL,
          source TEXT NOT NULL,
          text TEXT NOT NULL,
          user TEXT,     -- JSON string for user object
          module TEXT NOT NULL,
          priority TEXT,
          sentiment TEXT,
          topics TEXT,   -- JSON string for topics array
          raw_data TEXT  -- JSON string for raw_data object
        )
      `, (err) => {
        if (err) {
          console.error('Error creating feedback table:', err.message);
          return reject(err);
        }
        console.log('Table "feedback" created or already exists.');
        resolve();
      });
    });
  });
};

// Example of how to run this directly if needed, though it's better to call it from app startup or a dedicated script.
/*
if (require.main === module) {
  initializeTables()
    .then(() => console.log('Database tables initialized successfully.'))
    .catch(error => console.error('Failed to initialize database tables:', error))
    .finally(() => {
      const db = getDB();
      if (db) {
        db.close(err => {
          if (err) {
            console.error(err.message);
          }
          console.log('Closed the database connection.');
        });
      }
    });
}
*/
