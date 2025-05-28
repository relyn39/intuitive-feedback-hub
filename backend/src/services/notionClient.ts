import { Client } from '@notionhq/client';
import { QueryDatabaseResponse, PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { FeedbackItem } from '../types/feedback';
import { NOTION_API_KEY, NOTION_DATABASE_ID } from '../config';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs if Notion page ID isn't used directly or for new items

// Initialize Notion client
const notion = new Client({ auth: NOTION_API_KEY });

// Helper to extract rich text content
const getRichTextValue = (property: any): string => {
  if (property && property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map((rt: any) => rt.plain_text).join('');
  }
  return '';
};

// Helper to extract title content
const getTitleValue = (property: any): string => {
  if (property && property.title && property.title.length > 0) {
    return property.title.map((t: any) => t.plain_text).join('');
  }
  return '';
};

// Helper to extract select property value (name)
const getSelectValue = (property: any): string | undefined => {
  return property?.select?.name;
};

// Helper to extract multi-select property values (names)
const getMultiSelectValues = (property: any): string[] | undefined => {
  return property?.multi_select?.map((s: any) => s.name);
};

// Helper to extract date property value
const getDateValue = (property: any): Date | undefined => {
  if (property?.date?.start) {
    return new Date(property.date.start);
  }
  return undefined;
};

// Helper to extract files property (e.g., user avatar URL from a files column)
// This is a simplification; you might need more complex logic for user avatars.
const getUserDetailsFromProperties = (properties: any): FeedbackItem['user'] => {
    const userName = getRichTextValue(properties['User Name']); // Assuming 'User Name' is a Text/RichText property
    const userEmail = getRichTextValue(properties['User Email']); // Assuming 'User Email' is an Email property
    // You might have a 'User ID' field too
    const userId = getRichTextValue(properties['User ID']);

    const user: FeedbackItem['user'] = {};
    if (userName) user.name = userName;
    if (userEmail) user.email = userEmail;
    if (userId) user.id = userId;
    
    // If no specific user details, default to anonymous or skip user field
    return Object.keys(user).length > 0 ? user : { name: 'Anonymous' };
};


// Maps a Notion page to a FeedbackItem
// IMPORTANT: Adjust property names ('Feedback Text', 'Source', etc.) to match your Notion database columns.
const mapNotionPageToFeedbackItem = (page: PageObjectResponse): FeedbackItem => {
  const properties = page.properties as any; // Cast to any to simplify property access

  // Example mapping - adapt these to your Notion database structure
  const feedbackText = getTitleValue(properties['Name']) || getRichTextValue(properties['Feedback Text']); // Common to use 'Name' (title) or a dedicated 'Feedback Text'
  
  return {
    id: page.id, // Use Notion page ID as the feedback item ID
    createdAt: getDateValue(properties['Created At']) || new Date(page.created_time),
    source: getSelectValue(properties['Source']) || 'Notion',
    text: feedbackText,
    user: getUserDetailsFromProperties(properties), // Example: if user details are separate properties
    module: getSelectValue(properties['Module']) || 'General',
    priority: getSelectValue(properties['Priority']) as FeedbackItem['priority'] || undefined,
    sentiment: getSelectValue(properties['Sentiment']) as FeedbackItem['sentiment'] || undefined,
    topics: getMultiSelectValues(properties['Topics']) || [],
    raw_data: {
      notionPageId: page.id,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      // Add any other raw properties you want to keep
    },
  };
};


export const fetchFeedbackFromNotion = async (): Promise<FeedbackItem[]> => {
  if (NOTION_API_KEY === 'YOUR_NOTION_API_KEY_PLACEHOLDER' || NOTION_DATABASE_ID === 'YOUR_NOTION_DATABASE_ID_PLACEHOLDER') {
    console.warn(
      'Notion API Key or Database ID is using placeholder values. Skipping actual Notion fetch.' +
      'Please configure them in your environment or .env file and backend/src/config/index.ts.'
    );
    // Return empty or some mock data for development if placeholders are used
    return [
        // { id: uuidv4(), createdAt: new Date(), source: 'Notion (Mock)', text: 'Placeholder: Configure Notion API Key/DB ID', user: {name: "System"}, module: "Setup", priority: "high" }
    ];
  }

  console.log(`Fetching feedback from Notion database: ${NOTION_DATABASE_ID}...`);
  const allFeedbackItems: FeedbackItem[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  try {
    while (hasMore) {
      const response: QueryDatabaseResponse = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: startCursor,
        page_size: 100, // Max 100 per request
        // Add filters or sorts here if needed
        // e.g., filter: { property: "Status", select: { equals: "To Process" } }
      });

      response.results.forEach((page) => {
        // Ensure it's a full PageObjectResponse and not a PartialPageObjectResponse
        if ('properties' in page) {
          allFeedbackItems.push(mapNotionPageToFeedbackItem(page as PageObjectResponse));
        }
      });

      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    console.log(`Successfully fetched ${allFeedbackItems.length} feedback items from Notion.`);
    return allFeedbackItems;

  } catch (error: any) {
    console.error('Error fetching data from Notion:', error.body || error.message);
    // Depending on the error, you might want to throw it or return an empty array
    // For example, if it's an auth error, retrying won't help.
    // Consider specific error handling for rate limits if you expect high volume.
    return []; // Return empty on error to prevent breaking data sync, or throw
  }
};

// Example of how you might use this (optional, for testing the function)
/*
async function testFetch() {
  if (require.main === module) {
    // Temporarily set for local testing if .env isn't picked up by ts-node run
    // process.env.NOTION_API_KEY = 'your_real_key_for_testing';
    // process.env.NOTION_DATABASE_ID = 'your_real_db_id_for_testing';
    // Need to re-import config if you set env vars here after initial import
    // const config = await import('../config'); // Re-evaluate config

    console.log("Testing Notion Fetch...");
    const feedbackItems = await fetchFeedbackFromNotion();
    console.log(`Fetched ${feedbackItems.length} items:`);
    feedbackItems.slice(0, 2).forEach(item => console.log(JSON.stringify(item, null, 2)));
  }
}
testFetch().catch(console.error);
*/
