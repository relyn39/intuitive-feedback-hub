import { getDB } from '../database/sqlite';
import { mockFeedbackData } from './generateMockData';
import { initializeTables } from '../database/schema';
import { FeedbackItem } from '../types/feedback'; // Corrected import

export const loadMockData = async (): Promise<void> => {
  try {
    // Ensure tables are created
    await initializeTables();
    console.log('Database tables ensured.');

    const db = getDB();
    let insertedCount = 0;
    let skippedCount = 0;

    // Using a prepared statement for efficiency and safety
    const stmt = db.prepare(`
      INSERT INTO feedback (id, createdAt, source, text, user, module, priority, sentiment, topics, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING -- Skip if ID already exists
    `);

    for (const item of mockFeedbackData) {
      // Need to stringify JSON objects/arrays
      const userJson = JSON.stringify(item.user);
      const topicsJson = item.topics ? JSON.stringify(item.topics) : null;
      const rawDataJson = item.raw_data ? JSON.stringify(item.raw_data) : null;
      const createdAtString = item.createdAt.toISOString();

      await new Promise<void>((resolve, reject) => {
        stmt.run(
          item.id,
          createdAtString,
          item.source,
          item.text,
          userJson,
          item.module,
          item.priority || null, // Handle optional fields that might be undefined
          item.sentiment || null,
          topicsJson,
          rawDataJson,
          function (this: sqlite3.RunResult, err: Error | null) { // Use function to get 'this.changes'
            if (err) {
              console.error('Error inserting mock data item:', item.id, err.message);
              return reject(err);
            }
            if (this.changes > 0) {
              insertedCount++;
            } else {
              skippedCount++; // ID already existed
            }
            resolve();
          }
        );
      });
    }

    stmt.finalize((err) => {
      if (err) {
        console.error('Error finalizing statement:', err.message);
      }
    });

    console.log(`Successfully inserted ${insertedCount} new mock feedback items.`);
    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} items as they already existed in the database.`);
    }

  } catch (error) {
    console.error('Failed to load mock data:', error);
    // Propagate error if needed for script execution status
    // throw error; 
  }
};

// To run this script directly using `ts-node loadMockData.ts`
// Ensure tsconfig.json is set up for ts-node or use `ts-node-dev`
// Or add a script in package.json: "load-mock-data": "ts-node src/scripts/loadMockData.ts"
/*
if (require.main === module) {
  loadMockData()
    .then(() => {
      console.log('Mock data loading process finished.');
      // Close DB connection if the script is standalone and exiting
      const db = getDB();
      if (db) {
        db.close(err => {
          if (err) console.error('Error closing database:', err.message);
          else console.log('Database connection closed.');
        });
      }
    })
    .catch(error => {
      console.error('Unhandled error in loadMockData script:', error);
      process.exit(1); // Exit with error status
    });
}
*/
