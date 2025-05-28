import { FeedbackItem } from '../types/feedback';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs

// Helper function to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Possible values for mock data
const sources = ['Notion', 'SurveyMonkey', 'AppStore', 'Zendesk', 'Email'];
const users = [
  { id: 'user1', name: 'Alice Smith', email: 'alice@example.com' },
  { id: 'user2', name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 'user3', name: 'Charlie Brown', email: 'charlie@example.com' },
  { name: 'Anonymous' }, // User without id/email
];
const modules = ['Login', 'Payment', 'UX', 'Dashboard', 'Settings', 'API'];
const priorities: FeedbackItem['priority'][] = ['low', 'medium', 'high', 'critical'];
const sentiments: FeedbackItem['sentiment'][] = ['positive', 'negative', 'neutral'];
const sampleTopics = [['bug', 'ui'], ['feature_request'], ['performance', 'slow'], ['login_issue']];
const sampleTexts = [
  'The app crashes when I try to upload a file.',
  'It would be great to have a dark mode feature.',
  'Login takes too long on mobile.',
  'The new dashboard is very intuitive, great job!',
  'Payment failed with error code 500.',
  'User experience for password reset is confusing.',
  'API documentation needs more examples.',
  'Love the new update, especially the search functionality!',
  'Cannot find the settings page.',
  'App is slow to load on startup.',
];

export const mockFeedbackData: FeedbackItem[] = [];

for (let i = 0; i < 75; i++) { // Generate 75 mock items
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Within last 30 days
  const source = getRandomElement(sources);
  const user = getRandomElement(users);
  const module = getRandomElement(modules);
  const text = getRandomElement(sampleTexts) + ` (Mock item ${i + 1})`;

  const item: FeedbackItem = {
    id: uuidv4(),
    createdAt,
    source,
    text,
    user,
    module,
    priority: Math.random() > 0.3 ? getRandomElement(priorities) : undefined, // Optional
    sentiment: Math.random() > 0.2 ? getRandomElement(sentiments) : undefined, // Optional
    topics: Math.random() > 0.4 ? getRandomElement(sampleTopics) : undefined, // Optional
    raw_data: {
      originalId: `source_id_${i}`,
      sourceSpecificField: `value_${i}`,
      timestamp: createdAt.toISOString(),
    },
  };
  mockFeedbackData.push(item);
}

// Example of how to get this data (e.g., for console logging or writing to a file)
/*
if (require.main === module) { // To run this script directly using `ts-node generateMockData.ts`
  console.log(JSON.stringify(mockFeedbackData, null, 2));
}
*/
