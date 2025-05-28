import cron from 'node-cron';
import { syncNotionData } from './scripts/syncNotionData';

export const initializeScheduledJobs = () => {
  console.log('Initializing scheduled jobs...');

  // Schedule syncNotionData to run once a day at midnight (00:00)
  // You can change the cron expression as needed.
  // E.g., '*/5 * * * *' for every 5 minutes (for testing)
  const notionSyncJob = cron.schedule('0 0 * * *', async () => {
    console.log('--------------------------------------------------');
    console.log(`[${new Date().toISOString()}] Running scheduled Notion data synchronization...`);
    try {
      const stats = await syncNotionData();
      console.log(`[${new Date().toISOString()}] Notion data synchronization completed successfully.`);
      console.log(`Sync Stats: Inserted/Updated: ${stats.inserted}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during scheduled Notion data synchronization:`, error);
    }
    console.log('--------------------------------------------------');
  }, {
    scheduled: true,
    timezone: "Etc/UTC" // Specify timezone, e.g., "America/New_York" or "Etc/UTC"
  });

  console.log('Notion data synchronization job scheduled to run daily at 00:00 UTC.');
  // You can add more jobs here if needed

  // Optional: To test it runs soon after startup (e.g., 1 minute from now for dev)
  /*
  const now = new Date();
  const testTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now
  const testCronExpression = `${testTime.getMinutes()} ${testTime.getHours()} ${testTime.getDate()} ${testTime.getMonth() + 1} *`;
  cron.schedule(testCronExpression, async () => {
    console.log(`[${new Date().toISOString()}] Running TEST Notion data synchronization...`);
    await syncNotionData();
  }, { scheduled: true, timezone: "Etc/UTC" });
  console.log(`Test Notion sync job scheduled for: ${testCronExpression}`);
  */

  // Graceful shutdown handling (optional but good practice)
  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down scheduled jobs...');
    notionSyncJob.stop();
    // Stop other jobs if any
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down scheduled jobs...');
    notionSyncJob.stop();
    // Stop other jobs if any
    process.exit(0);
  });

  return {
    notionSyncJob
  };
};
