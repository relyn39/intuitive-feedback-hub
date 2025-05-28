import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

export const NOTION_API_KEY = process.env.NOTION_API_KEY || 'YOUR_NOTION_API_KEY_PLACEHOLDER';
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || 'YOUR_NOTION_DATABASE_ID_PLACEHOLDER';

// Check if placeholders are being used and log a warning
if (NOTION_API_KEY === 'YOUR_NOTION_API_KEY_PLACEHOLDER') {
  console.warn('Warning: NOTION_API_KEY is using a placeholder value. Please set it in your environment variables or .env file.');
}
if (NOTION_DATABASE_ID === 'YOUR_NOTION_DATABASE_ID_PLACEHOLDER') {
  console.warn('Warning: NOTION_DATABASE_ID is using a placeholder value. Please set it in your environment variables or .env file.');
}

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_PLACEHOLDER';

if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_PLACEHOLDER') {
  console.warn('Warning: OPENAI_API_KEY is using a placeholder value. Please set it in your environment variables or .env file.');
}
