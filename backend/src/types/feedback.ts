export interface FeedbackItem {
  id: string; // UUID or auto-incremented by DB
  createdAt: Date;
  source: string; // e.g., 'Notion', 'SurveyMonkey', 'AppStore'
  text: string; // The actual feedback content
  user: { // Optional user details
    id?: string;
    name?: string;
    email?: string;
  };
  module: string; // e.g., 'Login', 'Payment', 'UX'
  priority?: 'low' | 'medium' | 'high' | 'critical'; // Optional
  sentiment?: 'positive' | 'negative' | 'neutral'; // Populated by AI, optional for raw data
  topics?: string[]; // Tags or classified topics, optional
  raw_data?: any; // Store original data from source, optional
}
