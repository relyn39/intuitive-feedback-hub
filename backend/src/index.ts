import express, { Request, Response } from 'express';
import { getDB as getSqliteDB } from './database/sqlite';
import { initializeTables } from './database/schema';
import { loadMockData } from './scripts/loadMockData'; // For dev auto-load

// Attempt to import DuckDB, but make it optional
try {
  // Dynamically import duckdb.ts only if needed and available
  // We are not using it directly in index.ts to avoid startup errors
  console.log('DuckDB module found (though not necessarily connectable if install failed).');
  // import { getDB as getDuckDBInternal } from './database/duckdb'; // Example
} catch (e) {
  console.warn(
    'DuckDB module not found or failed to load. Continuing without DuckDB support.'
  );
}

const app = express();
const port = process.env.PORT || 3001;

// Initialize and setup database
async function initializeDatabase() {
  try {
    const sqliteDb = getSqliteDB(); // Ensures connection is open
    console.log('SQLite database connection established/verified.');

    // You can perform a simple query to ensure it's working if desired
    sqliteDb.get('SELECT sqlite_version() as version', (err, row) => {
      if (err) {
        console.error('Failed to query SQLite version:', err.message);
      } else {
        console.log(`SQLite version: ${(row as { version: string }).version}`);
      }
    });

    await initializeTables(); // Create tables if they don't exist
    console.log('Database tables initialized.');

    // Load mock data in development environment
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) { // Default to dev if NODE_ENV is not set
      console.log('Development environment detected, loading mock data...');
      await loadMockData();
      console.log('Mock data loading process completed.');
    }
  } catch (error) {
    console.error('Failed to initialize and setup database:', error);
    // Depending on the severity, you might want to exit the process
    // process.exit(1); 
  }
}

// Middleware
app.use(express.json()); // To parse JSON bodies

// Routes
import feedbackRoutes from './routes/feedbackRoutes';
app.use('/api', feedbackRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Start the server after database initialization
import { initializeScheduledJobs } from './scheduler';

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Initialize scheduled jobs after server starts
    initializeScheduledJobs();
  });
}).catch(error => {
  console.error("Failed to start server due to database initialization issues:", error);
  process.exit(1); // Exit if DB setup fails critically
});
