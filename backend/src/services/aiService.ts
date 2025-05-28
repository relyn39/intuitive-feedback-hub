// TODO: Replace with actual sentiment analysis library/API (e.g., HuggingFace, Vertex AI, AWS Comprehend)

/**
 * Analyzes the sentiment of a given text.
 * This is a placeholder implementation.
 *
 * @param text The text to analyze.
 * @returns A promise that resolves to 'positive', 'negative', or 'neutral'.
 */
export const analyzeSentiment = async (text: string): Promise<'positive' | 'negative' | 'neutral'> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to mimic async call

  // Placeholder sentiment analysis logic
  const positiveKeywords = ['good', 'great', 'love', 'excellent', 'amazing', 'awesome', 'happy', 'satisfied', 'like', 'wonderful', 'perfect'];
  const negativeKeywords = ['bad', 'terrible', 'hate', 'poor', 'awful', 'sad', 'disappointed', 'dislike', 'problem', 'issue', 'bug', 'crash'];
  const lowerText = text.toLowerCase();

  if (positiveKeywords.some(kw => lowerText.includes(kw))) {
    return 'positive';
  }
  if (negativeKeywords.some(kw => lowerText.includes(kw))) {
    return 'negative';
  }

  // Fallback: Random sentiment for more variety if no keywords matched, or default to neutral
  // For more deterministic placeholder behavior during testing, let's default to neutral
  // const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
  // return sentiments[Math.floor(Math.random() * sentiments.length)];
  
  return 'neutral'; // Default if no strong keywords are found
};

// TODO: Replace with actual topic modeling/classification (e.g., BERTopic, LLM-based classification)
/**
 * Classifies topics from a given text using basic keyword matching.
 * This is a placeholder implementation.
 *
 * @param text The text to classify.
 * @returns A promise that resolves to an array of topic strings.
 */
export const classifyTopics = async (text: string): Promise<string[]> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 30)); // Small delay

  const lowerText = text.toLowerCase();
  const foundTopics: string[] = [];

  if (lowerText.includes('login') || lowerText.includes('password') || lowerText.includes('signin') || lowerText.includes('auth')) {
    foundTopics.push('Login & Authentication');
  }
  if (lowerText.includes('payment') || lowerText.includes('credit card') || lowerText.includes('checkout') || lowerText.includes('billing')) {
    foundTopics.push('Payment & Billing');
  }
  if (lowerText.includes('ui') || lowerText.includes('design') || lowerText.includes('interface') || lowerText.includes('ux')) {
    foundTopics.push('UI/UX Feedback');
  }
  if (lowerText.includes('slow') || lowerText.includes('performance') || lowerText.includes('crash') || lowerText.includes('bug') || lowerText.includes('error')) {
    foundTopics.push('Performance & Bugs');
  }
  if (lowerText.includes('feature') || lowerText.includes('suggestion') || lowerText.includes('idea') || lowerText.includes('request')) {
    foundTopics.push('Feature Request');
  }
  if (lowerText.includes('support') || lowerText.includes('help') || lowerText.includes('documentation') || lowerText.includes('guide')) {
    foundTopics.push('Support & Documentation');
  }

  // If no specific topics are found and text is not empty, classify as 'General Feedback'
  if (foundTopics.length === 0 && text.trim().length > 0) {
    foundTopics.push('General Feedback');
  }
  
  // Ensure no duplicate topics if keywords overlap significantly for multiple categories
  return Array.from(new Set(foundTopics)); 
};

// OpenAI Client Initialization
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config';

let openai: OpenAI | null = null;
let isOpenAIConfigured = false;

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_PLACEHOLDER') {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    isOpenAIConfigured = true;
    console.log('OpenAI client configured successfully.');
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    openai = null; // Ensure it's null if initialization fails
  }
} else {
  console.warn(
    'OpenAI API Key is not configured or is using a placeholder. ' +
    'LLM-based NLQ features will be disabled. ' +
    'Please set OPENAI_API_KEY in your environment or .env file.'
  );
}

export const getOpenAIClient = (): OpenAI | null => {
  return openai;
};

export const isLLMAvailable = (): boolean => {
  return isOpenAIConfigured && openai !== null;
};
