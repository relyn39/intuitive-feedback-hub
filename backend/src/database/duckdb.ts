import duckdb, { Database } from 'duckdb'; // Attempt to import Database type

let db: Database | null = null; // Use imported Database type

export const getDB = (): Database => {
  if (!db) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db = new (duckdb as any).Database('dev.db', (err: any) => {
      if (err) {
        console.error('Failed to connect to DuckDB:', err);
      } else {
        console.log('Connected to DuckDB');
      }
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return db!; // Add non-null assertion as db is initialized in getDB
};

// Initialize DB connection when module is loaded
// Consider if this immediate connection is desired or should be deferred
getDB();
