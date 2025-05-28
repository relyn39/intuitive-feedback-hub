# Backend API

This is the backend API for the project, built with Node.js, Express.js, and TypeScript.

## Prerequisites

* Node.js (v18 or later recommended)
* npm

## Setup

1.  **Clone the repository (if applicable) or ensure you are in the `backend` directory.**

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file (if needed for environment variables):**
    Based on `src/config/index.ts` or other configuration files. For now, the port is hardcoded or uses `process.env.PORT`.

## Available Scripts

*   **`npm run build`**: Compiles TypeScript code to the `dist` directory.
*   **`npm run start:dev`**: Starts the development server using `nodemon` and `ts-node`. The server will automatically restart on file changes.
    *   On startup in development mode, the application will:
        1.  Ensure the SQLite database connection.
        2.  Initialize database tables (e.g., `feedback` table).
        3.  Load mock feedback data into the database.
*   **`npm start`**: (Assuming you add this script later to run the compiled code from `dist`) e.g., `node dist/index.js`
*   **Manual Scripts (via ts-node):**
    *   `npx ts-node src/scripts/generateMockData.ts`: (If modified to output JSON) Can be used to view generated mock data.
    *   `npx ts-node src/scripts/loadMockData.ts`: Can be used to manually load/reload mock data. This is also run on startup in dev mode.
    *   `npx ts-node src/scripts/syncNotionData.ts`: Can be used to manually trigger data synchronization from Notion.
    *   `npx ts-node src/database/schema.ts`: (If modified to be runnable) Can be used to manually initialize tables. This is also run on startup.

## Project Structure

*   `src/`: Contains all TypeScript source code.
    *   `index.ts`: Main entry point for the application.
    *   `routes/`: API route definitions.
    *   `config/`: Configuration files, including `index.ts` for API keys and other settings.
    *   `database/`: Database connection and query logic.
        *   `sqlite.ts`: SQLite connection setup.
        *   `duckdb.ts`: DuckDB connection setup (experimental).
        *   `schema.ts`: Defines table schemas and initialization (e.g., `feedback` table).
    *   `scripts/`: Utility scripts.
        *   `generateMockData.ts`: Generates an array of mock `FeedbackItem` objects.
        *   `loadMockData.ts`: Loads mock data into the SQLite database (primarily for development).
        *   `syncNotionData.ts`: Script to fetch data from Notion and sync it to the local SQLite database.
    *   `services/`: External service integrations.
        *   `notionClient.ts`: Client for interacting with the Notion API.
    *   `scheduler.ts`: Contains scheduled tasks (e.g., daily Notion data sync using `node-cron`).
    *   `types/`: TypeScript type definitions.
        *   `feedback.ts`: Defines the `FeedbackItem` interface.
*   `dist/`: Contains compiled JavaScript code (after running `npm run build`).
*   `node_modules/`: Contains all installed npm packages.
*   `.eslintrc.js`: ESLint configuration.
*   `.prettierrc.js`: Prettier configuration.
*   `tsconfig.json`: TypeScript compiler options.
*   `package.json`: Project metadata and dependencies.

## Running the Application

1.  **Development Mode:**
    ```bash
    npm run start:dev
    ```
    The server will typically start on `http://localhost:3001`.

2.  **Production Mode (Example):**
    First, build the project:
    ```bash
    npm run build
    ```
    Then, run the compiled code (you might need to add a `start` script to `package.json` for this):
    ```bash
    node dist/index.js
    ```

## Health Check

To verify the server is running, you can access the health check endpoint:

`GET /health`

This should return a `200 OK` status.

## Database

This project is configured to use **SQLite** for local development by default. A local database file (`dev.sqlite3`) will be created in the `backend` directory when the application first connects to the SQLite database.

Upon startup, the server will:
1.  Establish a connection to the SQLite database.
2.  Initialize the necessary tables (e.g., `feedback`) if they don't already exist.
3.  In development mode (`npm run start:dev`), load a set of mock feedback data into the `feedback` table.
4.  Initialize scheduled jobs, including a daily sync from Notion (see "Data Ingestion from Notion" below).

You should see console messages indicating the status of these operations.

**DuckDB (Experimental/Future Use):**
The project also includes configuration for DuckDB (`src/database/duckdb.ts`). However, due to persistent installation issues with the `duckdb` npm package in some environments, its usage is currently experimental. The application is configured to start even if `duckdb` is not installed or fails to load, and it will log a warning in such cases. If `duckdb` installation is successful in your environment, you can adapt the application to use it. A `dev.db` file would be created for DuckDB.

## Data Ingestion from Notion

The application is designed to fetch feedback data directly from a Notion database.

### Configuration

To enable Notion integration, you must configure the following environment variables (e.g., in a `.env` file in the `backend` directory):

*   `NOTION_API_KEY`: Your Notion API integration token (secret).
*   `NOTION_DATABASE_ID`: The ID of your Notion database where feedback is stored.

These are loaded via `backend/src/config/index.ts`. If these are not set, the application will use placeholder values and log warnings, and actual Notion fetching will be skipped.

**Example `.env` file (place in `backend` directory):**
```env
NOTION_API_KEY=secret_YOUR_NOTION_API_KEY
NOTION_DATABASE_ID=your_notion_database_id_here
```

### Synchronization Process

*   **`backend/src/services/notionClient.ts`:** Contains the logic to connect to the Notion API using `@notionhq/client`, query the specified database, and map Notion page properties to the application's `FeedbackItem` data structure. It handles pagination to retrieve all items.
*   **`backend/src/scripts/syncNotionData.ts`:** This script orchestrates the data synchronization. 
    *   It calls `fetchFeedbackFromNotion()` to get data.
    *   **Sentiment Analysis:** For each fetched item, if sentiment is not already provided by Notion and text is present, it calls a placeholder sentiment analysis function from `backend/src/services/aiService.ts` to determine a sentiment ('positive', 'negative', 'neutral').
    *   It then inserts or updates the items (including the determined sentiment) into the local SQLite `feedback` table, using the Notion Page ID as the primary key for deduplication and updates.
*   **`backend/src/scheduler.ts`:** A scheduler using `node-cron` is set up to automatically run the `syncNotionData.ts` script once a day at midnight (00:00 UTC). This ensures the local database is kept relatively up-to-date with the Notion data. The server initializes this scheduler on startup. You can also trigger the sync manually by running `npx ts-node src/scripts/syncNotionData.ts`.

### AI Processing

*   **Sentiment Analysis (`backend/src/services/aiService.ts`):**
    *   Currently, a **placeholder** sentiment analysis function (`analyzeSentiment`) is implemented.
    *   This function uses a basic keyword matching approach (e.g., "good" -> positive, "bad" -> negative) and defaults to "neutral".
    *   **This is NOT a production-ready sentiment analysis solution.** It is intended as a temporary stand-in.
    *   A `TODO` comment in the file highlights the need to replace this with an actual AI/ML-based sentiment analysis service.
    *   The determined sentiment is stored in the `sentiment` column of the `feedback` table during the Notion data synchronization process.
*   **Topic Classification (`backend/src/services/aiService.ts`):**
    *   A **placeholder** topic classification function (`classifyTopics`) has been implemented.
    *   This function uses basic keyword matching (e.g., "login" -> "Login & Authentication", "payment" -> "Payment & Billing").
    *   If no specific keywords are found, it defaults to "General Feedback".
    *   **This is NOT a production-ready topic classification solution.** It's a stand-in.
    *   A `TODO` comment highlights the need for replacement with more advanced techniques (e.g., BERTopic, LLM-based classification).
    *   The classified topics (an array of strings) are stored as a JSON string in the `topics` column of the `feedback` table during data synchronization.

### Data Transformation (dbt) - Conceptual

While not yet implemented with a running dbt pipeline, the conceptual plan for data transformation is as follows:

1.  **Raw Data Ingestion:** The `syncNotionData.ts` script ingests data from Notion into a table that can be considered "raw" (e.g., directly mapping Notion columns). For the current setup, it directly populates the `feedback` table.
2.  **dbt Models:** In a more mature setup, dbt models would be used to:
    *   Define sources (e.g., the raw Notion data table).
    *   Clean and standardize data (e.g., trim whitespace, handle nulls, standardize casing).
    *   Transform data into a more structured and curated format (e.g., creating separate dimension tables for users or modules, if applicable).
    *   Perform deduplication or apply specific business logic.
    *   The final output of these dbt transformations would be the `feedback` table (or a similar analytics-ready table) that the API then queries.
3.  **dbt Workflow:** The dbt transformations would typically run after the raw data has been ingested by the sync script, possibly triggered by the scheduler or as a separate step in a data pipeline.

This approach separates the ingestion of raw data from its transformation and preparation for analytics, which is a common practice in data engineering. For the current scope, the transformation logic is minimal and handled directly within the `syncNotionData.ts` script or `notionClient.ts`.

### `feedback` Table Schema

The main table for storing feedback items is `feedback`. Its schema is as follows:

| Column     | Type   | Description                                                                 |
|------------|--------|-----------------------------------------------------------------------------|
| `id`       | TEXT   | Primary Key (UUID)                                                          |
| `createdAt`| TEXT   | Date of feedback creation (ISO 8601 format)                                 |
| `source`   | TEXT   | Source of the feedback (e.g., 'Notion', 'SurveyMonkey')                     |
| `text`     | TEXT   | The actual feedback content                                                 |
| `user`     | TEXT   | JSON string for user object (e.g., `{ "id": "...", "name": "..." }`)        |
| `module`   | TEXT   | Application module feedback relates to (e.g., 'Login', 'Payment')           |
| `priority` | TEXT   | Optional: 'low', 'medium', 'high', 'critical'                               |
| `sentiment`| TEXT   | Optional: 'positive', 'negative', 'neutral' (intended for AI population)    |
| `topics`   | TEXT   | Optional: JSON string for an array of topic tags (e.g., `["bug", "ui"]`)     |
| `raw_data` | TEXT   | Optional: JSON string to store the original data from the source            |

## API Endpoints

All API endpoints are prefixed with `/api`.

### GET `/api/metrics-overview`

*   **Objective:** Provides data for the dashboard's main metrics overview.
*   **Response:** An array of metric objects.
    ```json
    [
      { "title": "Total de Feedbacks", "value": 150, "change": "+5% vs S.P.", "trend": "up", "icon": "messageSquare", "color": "blue" },
      { "title": "Sentimento Positivo", "value": "75.0%", "change": "+2% vs S.P.", "trend": "up", "icon": "smile", "color": "green" },
      { "title": "Usuários Ativos", "value": 500, "change": "N/A", "trend": "neutral", "icon": "users", "color": "purple" },
      { "title": "Issues Críticos", "value": 5, "change": "-10% vs S.P.", "trend": "down", "icon": "alertTriangle", "color": "red" }
    ]
    ```
*   **Logic:** Calculates total feedbacks, positive sentiment percentage, active users (mocked), and critical issues from the `feedback` table. `change` and `trend` are currently mocked.

### GET `/api/sentiment-distribution`

*   **Objective:** Provides data for the sentiment distribution pie chart.
*   **Response:** An array of sentiment data objects.
    ```json
    [
      { "name": "Positivo", "value": 68.3, "count": 102, "color": "#10b981" },
      { "name": "Negativo", "value": 20.0, "count": 30, "color": "#f43f5e" },
      { "name": "Neutro", "value": 11.7, "count": 18, "color": "#6b7280" }
    ]
    ```
*   **Logic:** Groups feedback by sentiment, calculates counts and percentages for 'positive', 'negative', and 'neutral'.

### GET `/api/sentiment-trends`

*   **Objective:** Provides data for the sentiment trend chart.
*   **Response:** An array of daily sentiment trend data.
    ```json
    [
      { "date": "27/04", "positive": 68, "negative": 15, "neutral": 17, "total": 100 },
      { "date": "28/04", "positive": 75, "negative": 10, "neutral": 20, "total": 105 }
      // ... more data points
    ]
    ```
*   **Logic:** Groups feedback by creation date (day), counts positive, negative, and neutral sentiments for each day. Limited to the last 30 data points. Date is formatted as DD/MM.

### GET `/api/topics`

*   **Objective:** Provides data for the topics cluster visualization.
*   **Response:** An array of topic objects.
    ```json
    [
      { "id": "topic-1", "name": "Login", "count": 25, "sentiment": "negative", "change": "-5%", "keywords": ["mock_keyword1", "mock_keyword2", "login"] },
      { "id": "topic-2", "name": "Payment", "count": 15, "sentiment": "positive", "change": "+10%", "keywords": ["mock_keyword1", "mock_keyword2", "payment"] }
      // ... more topics
    ]
    ```
*   **Logic:** Derives topics by parsing the `topics` JSON array stored in each feedback item (populated by the placeholder `classifyTopics` AI service during data sync). It then counts the frequency of each individual topic string across all feedback items. The top 10 most frequent topics are returned. `sentiment` for each topic is determined by the dominant sentiment of feedback items tagged with that topic. `change` and `keywords` are currently mocked.

### GET `/api/insights`

*   **Objective:** Provides data for the actionable insights panel.
*   **Response:** An array of insight objects.
    ```json
    [
      {
        "type": "Melhoria Sugerida", "icon": "TrendingUp", "title": "Checkout de Pagamento Lento", 
        "description": "Usuários relatam lentidão no processo de checkout...", "severity": "Alta", "action": "Otimizar o fluxo"
      }
      // ... more insights
    ]
    ```
*   **Logic:** Returns a static list of mock insights.

### POST `/api/nlq`

*   **Objective:** Processes a natural language query about feedback data.
*   **Request Body:**
    ```json
    {
      "query": "your natural language query string"
    }
    ```
*   **Response:** A JSON object containing the answer and potentially related data.
    ```json
    // Example for "total feedbacks"
    {
      "answer": "There are 75 feedbacks in total.",
      "data": { "totalFeedbacks": 75 },
      "query": "how many feedbacks are there"
    }

    // Example for "sentiment for module Login"
    {
      "answer": "Sentiment for module \"Login\": positive: 10 negative: 5 neutral: 3",
      "data": {
        "module": "Login",
        "sentimentDistribution": [
          { "sentiment": "negative", "count": 5 },
          { "sentiment": "neutral", "count": 3 },
          { "sentiment": "positive", "count": 10 }
        ]
      },
      "query": "what is the sentiment for module login"
    }

    // Example for "top issues"
    {
        "answer": "Top reported negative feedback:\n- App is slow to load on startup. (Mock item 10) (2 mentions)\n- Login takes too long on mobile. (Mock item 3) (1 mentions)",
        "data": [
            { "text": "App is slow to load on startup. (Mock item 10)", "mentions": 2 },
            { "text": "Login takes too long on mobile. (Mock item 3)", "mentions": 1 }
        ],
        "query": "top issues"
    }
    
    // Example for "show feedbacks for module UX"
    {
        "answer": "Showing the latest 2 feedbacks for module \"UX\".",
        "data": [
            { "id": "uuid-...", "text": "User experience for password reset is confusing. (Mock item 6)", "sentiment": "negative", "createdAt": "2023-10-27T...", "user": {"name": "Anonymous"}, "priority": "medium"},
            { "id": "uuid-...", "text": "The new dashboard is very intuitive, great job! (Mock item 4)", "sentiment": "positive", "createdAt": "2023-10-25T...", "user": {"name": "Bob Johnson", "email": "bob@example.com"}, "priority": "high"}
        ],
        "query": "show feedbacks for module ux"
    }

    // Example for an unrecognized query
    {
      "answer": "Sorry, I couldn't understand that query. Try asking about total feedbacks, sentiment for a specific module, or top reported issues.",
      "query": "some unrecognized query"
    }
    ```
*   **Supported Queries (Examples):**
    *   "how many feedbacks are there?" / "total feedbacks"
    *   "what is the sentiment for module Login?" / "sentimento do módulo payment"
    *   "top issues" / "most reported issues" / "problemas mais reportados"
    *   "show feedbacks for module ux" / "feedbacks do módulo API"
*   **Logic:**
    *   The system first attempts to process the query using an LLM (OpenAI's GPT model, if `OPENAI_API_KEY` is configured). The LLM is prompted to translate the natural language query into a structured JSON object representing SQL query parameters (e.g., query type, fields, filters, order, limit).
    *   This JSON is then used by the backend to safely construct and execute an SQL query against the database. This approach avoids direct execution of LLM-generated SQL, enhancing security.
    *   If the LLM is not configured, cannot understand the query, or if an error occurs during the LLM processing or subsequent SQL execution, the system falls back to the original rule-based approach in `backend/src/services/nlqProcessor.ts`.
    *   The rule-based system matches keywords in the query to fetch corresponding data from the SQLite database.
*   **LLM Configuration:** To enable LLM-based query processing, set the `OPENAI_API_KEY` in your `.env` file. If not set or if a placeholder is used, the system will log a warning and rely solely on the rule-based fallback.
*   **Experimental Nature:** The LLM integration is experimental. The quality of responses for complex queries depends heavily on the LLM's understanding and the prompt engineering.

## Linting and Formatting

*   **Lint:**
    ```bash
    npm run lint  # (You may need to add this script: "lint": "eslint . --ext .ts")
    ```
*   **Format:**
    ```bash
    npm run format # (You may need to add this script: "format": "prettier --write .")
    ```
