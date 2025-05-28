import { getDB } from '../database/sqlite';
import { FeedbackItem } from '../types/feedback'; // For potential type casting if needed

// Helper to run SQLite queries
const runDBQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error running NLQ SQL query:', err.message, 'SQL:', sql, 'Params:', params);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

interface NLQResponse {
  answer: string;
  data?: any;
  query?: string; // For debugging, optional
}

export const processNLQ = async (query: string): Promise<NLQResponse> => {
  const lowerQuery = query.toLowerCase();
  let response: NLQResponse = {
    answer: "Sorry, I couldn't understand that query. Try asking about total feedbacks, sentiment for a specific module, or top reported issues.",
    query: query, // Include the original query for context
  };

  try {
    // Rule 1: Total feedbacks
    if (lowerQuery.includes('how many feedbacks') || lowerQuery.includes('total feedbacks') || lowerQuery.includes('number of feedbacks')) {
      const result = await runDBQuery('SELECT COUNT(*) as total FROM feedback;');
      const total = result[0]?.total || 0;
      response = {
        answer: `There are ${total} feedbacks in total.`,
        data: { totalFeedbacks: total },
        query: query,
      };
    }
    // Rule 2: Sentiment for a specific module
    else if (lowerQuery.includes('sentiment for module') || lowerQuery.includes('sentimento do módulo')) {
      const moduleMatch = lowerQuery.match(/(?:module|módulo)\s+([\w\s]+)/);
      if (moduleMatch && moduleMatch[1]) {
        const moduleName = moduleMatch[1].trim();
        // Capitalize first letter of module for consistency if needed, assuming stored as 'Login', 'Payment'
        const formattedModuleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).toLowerCase();
        
        const results = await runDBQuery(
          'SELECT sentiment, COUNT(*) as count FROM feedback WHERE module = ? AND sentiment IS NOT NULL GROUP BY sentiment;',
          [formattedModuleName]
        );
        
        if (results.length > 0) {
          let answerParts: string[] = [`Sentiment for module "${formattedModuleName}":`];
          results.forEach(row => {
            answerParts.push(`${row.sentiment}: ${row.count}`);
          });
          response = {
            answer: answerParts.join(' '),
            data: { module: formattedModuleName, sentimentDistribution: results },
            query: query,
          };
        } else {
          response = {
            answer: `No feedback data found for module "${formattedModuleName}" or sentiment is not defined.`,
            data: { module: formattedModuleName, sentimentDistribution: [] },
            query: query,
          };
        }
      }
    }
    // Rule 3: Top reported issues (simplified: negative feedback ordered by text count)
    else if (lowerQuery.includes('top issues') || lowerQuery.includes('most reported issues') || lowerQuery.includes('problemas mais reportados')) {
      const results = await runDBQuery(
        "SELECT text, COUNT(*) as mentions FROM feedback WHERE sentiment = 'negative' GROUP BY text ORDER BY mentions DESC LIMIT 5;"
      );
      if (results.length > 0) {
        const issues = results.map(row => `${row.text} (${row.mentions} mentions)`).join('\n- ');
        response = {
          answer: `Top reported negative feedback:\n- ${issues}`,
          data: results,
          query: query,
        };
      } else {
        response = {
          answer: 'No negative feedback found to determine top issues.',
          data: [],
          query: query,
        };
      }
    }
    // Rule 4: Show feedbacks for module X (limit 10)
    else if (lowerQuery.includes('show feedbacks for module') || lowerQuery.includes('feedbacks do módulo')) {
        const moduleMatch = lowerQuery.match(/(?:module|módulo)\s+([\w\s]+)/);
        if (moduleMatch && moduleMatch[1]) {
            const moduleName = moduleMatch[1].trim();
            const formattedModuleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).toLowerCase();

            const results = await runDBQuery(
                "SELECT id, text, sentiment, createdAt, user, priority FROM feedback WHERE module = ? ORDER BY createdAt DESC LIMIT 10;",
                [formattedModuleName]
            );

            if (results.length > 0) {
                response = {
                    answer: `Showing the latest ${results.length} feedbacks for module "${formattedModuleName}".`,
                    data: results.map(r => ({...r, user: JSON.parse(r.user || '{}')})), // Parse user JSON
                    query: query,
                };
            } else {
                response = {
                    answer: `No feedbacks found for module "${formattedModuleName}".`,
                    data: [],
                    query: query,
                };
            }
        }
    }

  } catch (error: any) {
    console.error('Error processing NLQ:', error);
    response = {
      answer: `There was an error processing your query: ${error.message}`,
      query: query,
    };
  }

  return response;
};

// --- LLM Integration for NLQ ---
import { getOpenAIClient, isLLMAvailable } from './aiService';

interface LLMQueryParameters {
  queryType: 'count' | 'select';
  fields?: string[]; // For select
  filters?: Array<{
    field: string; // Whitelisted: id, createdAt, source, text, module, priority, sentiment, topics (for LIKE)
    operator: 'EQUALS' | 'LIKE' | 'BETWEEN' | 'GREATER_THAN' | 'LESS_THAN' | 'INCLUDES_TOPIC'; // INCLUDES_TOPIC for JSON array in 'topics'
    value: any; // string, number, or [string, string] for BETWEEN
  }>;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' };
  limit?: number;
  error?: string; // If LLM cannot process
}

const whitelistedFields = ['id', 'createdAt', 'source', 'text', 'module', 'priority', 'sentiment', 'topics', 'user'];
const whitelistedOperators = ['EQUALS', 'LIKE', 'BETWEEN', 'GREATER_THAN', 'LESS_THAN', 'INCLUDES_TOPIC'];

async function translateQueryToSQLParamsWithLLM(query: string): Promise<LLMQueryParameters | null> {
  if (!isLLMAvailable()) {
    console.log('LLM not available or not configured. Skipping LLM translation.');
    return null;
  }

  const openai = getOpenAIClient();
  if (!openai) return null;

  const systemPrompt = `
    You are an expert at translating natural language questions about user feedback into structured JSON parameters for SQL queries.
    The user is querying a SQLite database with a 'feedback' table.
    Table schema:
    - id (TEXT PRIMARY KEY): Unique identifier for the feedback.
    - createdAt (TEXT): Date of feedback creation (ISO 8601 format, e.g., 'YYYY-MM-DDTHH:MM:SS.SSSZ'). You can use SQLite date functions like DATE(), JULIANDAY().
    - source (TEXT): Source of the feedback (e.g., 'Notion', 'SurveyMonkey').
    - text (TEXT): The actual feedback content.
    - user (JSON TEXT): User details as a JSON string (e.g., {"id": "...", "name": "...", "email": "..."}). Querying specific fields within this JSON is complex; prefer filtering by other columns if possible or treat as TEXT for LIKE comparisons on the whole JSON string.
    - module (TEXT): Application module the feedback relates to (e.g., 'Login', 'Payment', 'UX').
    - priority (TEXT): Optional priority ('low', 'medium', 'high', 'critical').
    - sentiment (TEXT): Optional sentiment ('positive', 'negative', 'neutral').
    - topics (JSON TEXT array): Optional topics as a JSON array of strings (e.g., '["bug", "ui"]'). Use 'INCLUDES_TOPIC' operator for these.

    Your goal is to output a JSON object with parameters.
    Allowed 'queryType': "select", "count".
    For "select", you can specify "fields" (array of column names from schema), "filters", "orderBy" ({field, direction: 'ASC'|'DESC'}), and "limit" (number). Default to ["id", "text", "sentiment", "module", "createdAt"] if fields are not specified.
    For "count", you can specify "filters".

    "filters" is an array of objects: { "field": "column_name", "operator": "OPERATOR", "value": "some_value" }.
    Allowed filter fields: ${whitelistedFields.join(', ')}.
    Allowed filter operators: ${whitelistedOperators.join(', ')}.
        - 'EQUALS': for exact matches.
        - 'LIKE': for partial text matches (use %wildcards% for value).
        - 'BETWEEN': for date ranges, value should be an array of two date strings [startDate, endDate].
        - 'GREATER_THAN', 'LESS_THAN': for dates or numerical comparisons (though we mostly have text).
        - 'INCLUDES_TOPIC': for checking if a JSON array in the 'topics' column contains a specific string. 'value' should be the topic string.

    Date Handling:
    - "last month": Calculate start and end dates for the previous calendar month from today.
    - "this month": Calculate start and end dates for the current calendar month.
    - "yesterday": Calculate the date for yesterday.
    - "last X days/weeks/months": Calculate date range based on X.
    - Always format dates as 'YYYY-MM-DD'. Today is ${new Date().toISOString().split('T')[0]}.

    Examples:
    1. User: "how many feedbacks about login issues last month?"
       Assistant: {
         "queryType": "count",
         "filters": [
           { "field": "module", "operator": "LIKE", "value": "%Login%" },
           { "field": "text", "operator": "LIKE", "value": "%issue%" },
           { "field": "createdAt", "operator": "BETWEEN", "value": ["YYYY-MM-01", "YYYY-MM-DD"] } // LLM calculates actual dates
         ]
       }
    2. User: "show me positive feedback about payments, order by date descending"
       Assistant: {
         "queryType": "select",
         "fields": ["id", "text", "sentiment", "module", "createdAt", "user"],
         "filters": [
           { "field": "sentiment", "operator": "EQUALS", "value": "positive" },
           { "field": "module", "operator": "LIKE", "value": "%Payment%" }
         ],
         "orderBy": { "field": "createdAt", "direction": "DESC" },
         "limit": 10
       }
    3. User: "what are the feedbacks concerning 'performance' topic?"
       Assistant: {
         "queryType": "select",
         "fields": ["id", "text", "topics", "module", "createdAt"],
         "filters": [
           { "field": "topics", "operator": "INCLUDES_TOPIC", "value": "performance" }
         ],
         "limit": 10
       }
    4. User: "gibberish text here"
       Assistant: { "error": "ambiguous_query", "message": "The query is too ambiguous or does not seem to relate to feedback data." }
    5. User: "delete all feedback"
       Assistant: { "error": "unsupported_operation", "message": "This operation is not supported." }

    Output only the JSON object. Do not add any explanatory text before or after the JSON.
    If the query is ambiguous, malicious, or requests an unsupported operation (like delete/update), return a JSON with an "error" field.
    Be careful with date calculations.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125', // Or your preferred model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      response_format: { type: "json_object" }, // Enforce JSON output
      temperature: 0.2, // Lower temperature for more deterministic output
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      console.log('LLM Raw Response:', content);
      const parsedParams = JSON.parse(content) as LLMQueryParameters;
      // Basic validation of parsed parameters
      if (parsedParams.error) {
        console.warn('LLM indicated an error:', parsedParams.error);
        return parsedParams; // Return the error structure
      }
      if (!parsedParams.queryType || !['select', 'count'].includes(parsedParams.queryType)) {
        console.error('LLM response missing or invalid queryType.');
        return { error: "llm_invalid_response", message: "LLM response had invalid queryType." };
      }
      // Further validation of filters, fields, etc. can be added here
      if (parsedParams.filters) {
        for (const filter of parsedParams.filters) {
          if (!whitelistedFields.includes(filter.field) || !whitelistedOperators.includes(filter.operator)) {
            console.error(`LLM response included non-whitelisted field or operator: ${filter.field}, ${filter.operator}`);
            return { error: "llm_unsafe_response", message: "LLM response included non-whitelisted operations."};
          }
        }
      }
      return parsedParams;
    }
    return { error: "llm_empty_response", message: "LLM returned an empty response." };
  } catch (error: any) {
    console.error('Error calling OpenAI:', error.message || error);
    return { error: "llm_api_error", message: `LLM API request failed: ${error.message}` };
  }
}

// Function to build and execute SQL from LLM parameters
// IMPORTANT: This function MUST sanitize and validate all parameters from the LLM.
async function buildAndExecuteSQLFromLLMParams(params: LLMQueryParameters): Promise<NLQResponse> {
  let sql = '';
  const queryParams: any[] = [];

  if (params.error) {
    return { answer: params.error, query: `LLM indicated: ${params.error}` };
  }

  // Build WHERE clause safely
  let whereClause = '';
  if (params.filters && params.filters.length > 0) {
    const filterClauses = params.filters.map(filter => {
      if (!whitelistedFields.includes(filter.field) || !whitelistedOperators.includes(filter.operator)) {
        throw new Error(`Invalid field or operator: ${filter.field}, ${filter.operator}`);
      }
      
      // Sanitize field name (though whitelisting helps a lot)
      const field = filter.field.replace(/[^a-zA-Z0-9_]/g, ''); 

      switch (filter.operator) {
        case 'EQUALS':
          queryParams.push(filter.value);
          return `${field} = ?`;
        case 'LIKE':
          queryParams.push(filter.value); // LLM should provide wildcards in value, e.g., "%Payment%"
          return `${field} LIKE ?`;
        case 'BETWEEN':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            queryParams.push(filter.value[0], filter.value[1]);
            return `${field} BETWEEN ? AND ?`;
          }
          throw new Error('BETWEEN operator requires an array of two values.');
        case 'GREATER_THAN':
          queryParams.push(filter.value);
          return `${field} > ?`;
        case 'LESS_THAN':
          queryParams.push(filter.value);
          return `${field} < ?`;
        case 'INCLUDES_TOPIC':
          // For JSON arrays, SQLite uses json_each and checks. Simplified here with LIKE for JSON text.
          // This is a common pattern for searching within JSON arrays stored as text.
          queryParams.push(`%"${filter.value}"%`); // e.g., search for '["...","topic_value","..."]'
          return `json_valid(${field}) AND ${field} LIKE ?`;
        default:
          throw new Error(`Unsupported operator: ${filter.operator}`);
      }
    });
    whereClause = `WHERE ${filterClauses.join(' AND ')}`;
  }

  if (params.queryType === 'count') {
    sql = `SELECT COUNT(*) as total FROM feedback ${whereClause};`;
  } else if (params.queryType === 'select') {
    const fieldsToSelect = params.fields && params.fields.length > 0 
      ? params.fields.filter(f => whitelistedFields.includes(f)).join(', ') 
      : 'id, text, sentiment, module, createdAt, user'; // Default fields
    if (!fieldsToSelect) throw new Error("No valid fields provided for select query.");

    sql = `SELECT ${fieldsToSelect} FROM feedback ${whereClause}`;

    if (params.orderBy && whitelistedFields.includes(params.orderBy.field)) {
      const direction = params.orderBy.direction === 'DESC' ? 'DESC' : 'ASC'; // Sanitize direction
      sql += ` ORDER BY ${params.orderBy.field.replace(/[^a-zA-Z0-9_]/g, '')} ${direction}`;
    }
    
    const limit = (params.limit && Number.isInteger(params.limit) && params.limit > 0) ? params.limit : 10;
    sql += ` LIMIT ${limit}`; // Add limit, default to 10
    sql += ';';

  } else {
    throw new Error(`Unsupported queryType: ${params.queryType}`);
  }

  console.log('Executing SQL from LLM params:', sql, queryParams);
  const results = await runDBQuery(sql, queryParams);

  if (params.queryType === 'count') {
    const total = results[0]?.total || 0;
    return { answer: `The total count is ${total}.`, data: { totalCount: total } };
  } else {
     // Parse user JSON string for each result if present
     const processedResults = results.map(row => {
        if (row.user && typeof row.user === 'string') {
          try {
            return { ...row, user: JSON.parse(row.user) };
          } catch (e) {
            console.warn(`Failed to parse user JSON for row ${row.id}:`, row.user);
            return { ...row, user: { name: "Error parsing user data"}}; // Keep user as original string or mark error
          }
        }
        return row;
      });
    return { answer: `Found ${processedResults.length} results.`, data: processedResults };
  }
}


// Main NLQ processing function
export const processNLQ = async (originalQuery: string): Promise<NLQResponse> => {
  console.log(`Processing NLQ: "${originalQuery}"`);

  // Attempt LLM translation first
  if (isLLMAvailable()) {
    const llmParams = await translateQueryToSQLParamsWithLLM(originalQuery);
    if (llmParams) {
      if (llmParams.error) {
        // If LLM explicitly returns an error (e.g. ambiguous), use its message.
        return { answer: `LLM Error: ${llmParams.error} - ${llmParams.message || 'Could not process with LLM.'}`, query: originalQuery };
      }
      try {
        console.log("Attempting to build and execute SQL from LLM params:", llmParams);
        // Security: buildAndExecuteSQLFromLLMParams MUST validate/sanitize params
        return await buildAndExecuteSQLFromLLMParams(llmParams);
      } catch (e: any) {
        console.error('Error executing SQL from LLM params:', e.message);
        // Fall through to rule-based if LLM-derived SQL fails, or return specific error
        // For now, let's return an error to make it clear LLM path was taken but failed execution
        return { answer: `Error executing query based on LLM understanding: ${e.message}`, query: originalQuery };
      }
    }
    // If llmParams is null (e.g., LLM not configured), it will fall through to rule-based.
    console.log("LLM translation returned null or LLM not available, falling back to rule-based.");
  }


  // Fallback to existing rule-based system
  const lowerQuery = originalQuery.toLowerCase();
  let response: NLQResponse = {
    answer: "Sorry, I couldn't understand that query. Try asking about total feedbacks, sentiment for a specific module, or top reported issues. The LLM was not available or could not process this.",
    query: originalQuery,
  };

  try {
    // Rule 1: Total feedbacks
    if (lowerQuery.includes('how many feedbacks') || lowerQuery.includes('total feedbacks') || lowerQuery.includes('number of feedbacks')) {
      const result = await runDBQuery('SELECT COUNT(*) as total FROM feedback;');
      const total = result[0]?.total || 0;
      response = {
        answer: `There are ${total} feedbacks in total.`,
        data: { totalFeedbacks: total },
        query: originalQuery,
      };
    }
    // Rule 2: Sentiment for a specific module
    else if (lowerQuery.includes('sentiment for module') || lowerQuery.includes('sentimento do módulo')) {
      const moduleMatch = lowerQuery.match(/(?:module|módulo)\s+([\w\s]+)/);
      if (moduleMatch && moduleMatch[1]) {
        const moduleName = moduleMatch[1].trim();
        const formattedModuleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).toLowerCase();
        
        const results = await runDBQuery(
          'SELECT sentiment, COUNT(*) as count FROM feedback WHERE module = ? AND sentiment IS NOT NULL GROUP BY sentiment;',
          [formattedModuleName]
        );
        
        if (results.length > 0) {
          let answerParts: string[] = [`Sentiment for module "${formattedModuleName}":`];
          results.forEach(row => {
            answerParts.push(`${row.sentiment}: ${row.count}`);
          });
          response = {
            answer: answerParts.join(' '),
            data: { module: formattedModuleName, sentimentDistribution: results },
            query: originalQuery,
          };
        } else {
          response = {
            answer: `No feedback data found for module "${formattedModuleName}" or sentiment is not defined.`,
            data: { module: formattedModuleName, sentimentDistribution: [] },
            query: originalQuery,
          };
        }
      }
    }
    // Rule 3: Top reported issues (simplified: negative feedback ordered by text count)
    else if (lowerQuery.includes('top issues') || lowerQuery.includes('most reported issues') || lowerQuery.includes('problemas mais reportados')) {
      const results = await runDBQuery(
        "SELECT text, COUNT(*) as mentions FROM feedback WHERE sentiment = 'negative' GROUP BY text ORDER BY mentions DESC LIMIT 5;"
      );
      if (results.length > 0) {
        const issues = results.map(row => `${row.text} (${row.mentions} mentions)`).join('\n- ');
        response = {
          answer: `Top reported negative feedback:\n- ${issues}`,
          data: results,
          query: originalQuery,
        };
      } else {
        response = {
          answer: 'No negative feedback found to determine top issues.',
          data: [],
          query: originalQuery,
        };
      }
    }
    // Rule 4: Show feedbacks for module X (limit 10)
    else if (lowerQuery.includes('show feedbacks for module') || lowerQuery.includes('feedbacks do módulo')) {
        const moduleMatch = lowerQuery.match(/(?:module|módulo)\s+([\w\s]+)/);
        if (moduleMatch && moduleMatch[1]) {
            const moduleName = moduleMatch[1].trim();
            const formattedModuleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).toLowerCase();

            const results = await runDBQuery(
                "SELECT id, text, sentiment, createdAt, user, priority FROM feedback WHERE module = ? ORDER BY createdAt DESC LIMIT 10;",
                [formattedModuleName]
            );

            if (results.length > 0) {
                response = {
                    answer: `Showing the latest ${results.length} feedbacks for module "${formattedModuleName}".`,
                    data: results.map(r => ({...r, user: JSON.parse(r.user || '{}')})), // Parse user JSON
                    query: originalQuery,
                };
            } else {
                response = {
                    answer: `No feedbacks found for module "${formattedModuleName}".`,
                    data: [],
                    query: originalQuery,
                };
            }
        }
    }

  } catch (error: any) {
    console.error('Error processing NLQ (rule-based fallback):', error);
    response = {
      answer: `There was an error processing your query (rule-based): ${error.message}`,
      query: originalQuery,
    };
  }

  return response;
};
