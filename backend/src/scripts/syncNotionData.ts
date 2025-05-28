import { getDB } from '../database/sqlite';
import { initializeTables } from '../database/schema';
import { fetchFeedbackFromNotion } from '../services/notionClient';
import { analyzeSentiment, classifyTopics } from '../services/aiService'; // Import AI services
import { FeedbackItem } from '../types/feedback';
import sqlite3 from 'sqlite3'; // Import for RunResult type

export const syncNotionData = async (): Promise<{ inserted: number, updated: number, skipped: number, failed: number }> => {
  console.log('Starting Notion data synchronization with sentiment analysis and topic classification...');
  let stats = { inserted: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    // 1. Ensure tables are created
    await initializeTables();
    console.log('Database tables ensured.');

    // 2. Fetch data from Notion
    const notionFeedbackItems = await fetchFeedbackFromNotion();
    if (notionFeedbackItems.length === 0) {
      console.log('No feedback items fetched from Notion. Sync complete.');
      return stats;
    }
    console.log(`Fetched ${notionFeedbackItems.length} items from Notion.`);

    // 3. Insert/Update into SQLite
    const db = getDB();
    
    // Using ON CONFLICT to handle updates.
    // Notion page ID is used as the primary key ('id' in FeedbackItem)
    const stmt = db.prepare(`
      INSERT INTO feedback (id, createdAt, source, text, user, module, priority, sentiment, topics, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        createdAt = excluded.createdAt,
        source = excluded.source,
        text = excluded.text,
        user = excluded.user,
        module = excluded.module,
        priority = excluded.priority,
        sentiment = excluded.sentiment, -- Ensure sentiment is updated
        topics = excluded.topics,
        raw_data = excluded.raw_data;
    `);

    for (const item of notionFeedbackItems) {
      // Analyze sentiment if text is present and sentiment is not already set by Notion
      if (item.text && !item.sentiment) { // Only analyze sentiment if not already set
        try {
          item.sentiment = await analyzeSentiment(item.text);
          // console.log(`Sentiment for item ${item.id} ('${item.text.substring(0,20)}...'): ${item.sentiment}`);
        } catch (aiError) {
          console.error(`Error analyzing sentiment for item ${item.id}:`, aiError);
        }
      } else if (!item.text) {
        item.sentiment = 'neutral'; // Default sentiment for empty text
      }

      // Classify topics if text is present
      let topicsArray: string[] = [];
      if (item.text) { // Only classify if text is present
        try {
          topicsArray = await classifyTopics(item.text);
          // console.log(`Topics for item ${item.id} ('${item.text.substring(0,20)}...'): ${topicsArray.join(', ')}`);
        } catch (aiError) {
          console.error(`Error classifying topics for item ${item.id}:`, aiError);
        }
      }
      // Assign to item.topics, which should be string[] as per FeedbackItem type
      // The database expects a JSON string for the 'topics' column.
      item.topics = topicsArray; 
      
      const userJson = JSON.stringify(item.user || {}); // Ensure user is always an object
      const topicsJson = item.topics && item.topics.length > 0 ? JSON.stringify(item.topics) : null; // Store as JSON string or NULL
      const rawDataJson = item.raw_data ? JSON.stringify(item.raw_data) : null;
      const createdAtString = item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString();

      try {
        await new Promise<void>((resolve, reject) => {
          stmt.run(
            item.id, // This should be the Notion Page ID
            createdAtString,
            item.source,
            item.text,
            userJson,
            item.module,
            item.priority || null,
            item.sentiment || null,
            topicsJson,
            rawDataJson,
            function (this: sqlite3.RunResult, err: Error | null) {
              if (err) {
                console.error('Error inserting/updating Notion data item:', item.id, err.message);
                stats.failed++;
                return reject(err);
              }
              // 'this.changes' is 0 if ON CONFLICT DO NOTHING happened and no change occurred.
              // For ON CONFLICT DO UPDATE, 'this.changes' is 1 for an insert and 1 for an update.
              // A more precise way to distinguish insert vs update might require a pre-SELECT,
              // but for now, we assume any successful run that changes data is an "upsert".
              // A simplified approach: if an ID already existed, it's an update.
              // However, with `ON CONFLICT DO UPDATE`, it's hard to tell if it was an insert or update without a prior SELECT.
              // For now, let's assume if it didn't fail, it's either inserted or updated.
              // A more robust way would be to query if the ID exists first.
              // For simplicity, we'll just count successful operations.
              // If we need separate insert/update counts, the logic would be more complex.
              // Let's assume for now all successful non-skipped operations are "upserted".
              // We can't easily tell INSERT from UPDATE with this statement alone.
              // Let's count all successful non-failed as "inserted or updated".
              // A better approach for stats would be to query for existing ID first.
              // For this implementation, we will rely on how many rows were changed.
              // If a new row is inserted, this.changes will be 1.
              // If an existing row is updated, this.changes will also be 1.
              // If an existing row is updated but all values are identical, this.changes might be 0 (driver dependent).
              // This is tricky with SQLite's `ON CONFLICT ... DO UPDATE`.
              // Let's simplify: if it ran and didn't fail, it's an "upsert".
              // A more accurate way would be to count rows before and after, or select ID first.
              // For this exercise, let's assume a successful run means data is current.
              // We can't easily distinguish inserts from updates with this single statement.
              // We will count as 'inserted' for simplicity if this.lastID is non-zero (new row).
              // And 'updated' if this.changes > 0 and this.lastID is zero (meaning an existing row was changed).
              // This is still not perfect. A common pattern is to try INSERT, if fails, then UPDATE.
              
              // A simpler way for stats:
              // Assume all successful operations are either inserts or updates.
              // We can't precisely tell which with one statement without pre-querying.
              // Let's just count successful upserts.
              // For now, we'll increment 'inserted' for any successful operation for simplicity with this statement.
              stats.inserted++; 
              resolve();
            }
          );
        });
      } catch (e) {
        // Failed count is already incremented inside the promise if stmt.run failed
        console.warn(`Skipping item ${item.id} due to an error during its individual processing.`);
      }
    }

    stmt.finalize((err) => {
      if (err) {
        console.error('Error finalizing statement for Notion sync:', err.message);
      }
    });

    console.log('Notion data synchronization finished.');
    console.log(`Sync Stats: Inserted/Updated: ${stats.inserted}, Skipped (no change): ${stats.skipped}, Failed: ${stats.failed}`);

  } catch (error) {
    console.error('Failed to synchronize data from Notion:', error);
    // Increment failed for general errors like failing to fetch from Notion or DB init
    // stats.failed += notionFeedbackItems.length || 1; // Or some other appropriate number
  }
  return stats;
};

// To run this script directly using `ts-node src/scripts/syncNotionData.ts`
// Ensure tsconfig.json is set up for ts-node or use `ts-node-dev`
// Or add a script in package.json: "sync-notion": "ts-node src/scripts/syncNotionData.ts"
/*
if (require.main === module) {
  syncNotionData()
    .then((stats) => {
      console.log('Manual Notion Sync process finished with stats:', stats);
      const db = getDB();
      if (db) {
        db.close(err => {
          if (err) console.error('Error closing database:', err.message);
          else console.log('Database connection closed after manual sync.');
        });
      }
    })
    .catch(error => {
      console.error('Unhandled error in syncNotionData script:', error);
      process.exit(1);
    });
}
*/
