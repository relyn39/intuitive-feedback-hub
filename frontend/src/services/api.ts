// Define the expected shape of a single metric item from the API
export interface MetricItem {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  // The backend currently does NOT send icon and color,
  // these will be handled by the frontend component based on title or use defaults.
  // icon: string; 
  // color: string;
}

export const fetchMetricsOverview = async (): Promise<MetricItem[]> => {
  const response = await fetch('/api/metrics-overview'); // Assumes proxy is set up

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || 'Failed to fetch metrics overview');
  }

  return response.json();
};

// Type for NLQ API response
export interface NLQResponse {
  answer: string;
  data?: any; // Could be an array of feedback items, metrics, etc.
  query?: string; // Original query, for context
}

export const postNLQuery = async (query: string): Promise<NLQResponse> => {
  const response = await fetch('/api/nlq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || 'Failed to process your query');
  }

  return response.json();
};

// Type for Insights API response items
export interface InsightItem {
  type: string; // e.g., "Melhoria Sugerida", "Bug Crítico"
  icon: string; // Icon name as a string (e.g., "TrendingUp", "Bug")
  title: string;
  description: string;
  severity: 'Alta' | 'Crítica' | 'Média' | 'Baixa' | string; // Allow string for flexibility if API changes
  action: string;
}

export const fetchInsights = async (): Promise<InsightItem[]> => {
  const response = await fetch('/api/insights');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || 'Failed to fetch insights');
  }
  return response.json();
};

// Type for Topics API response items
export interface TopicItem {
  id: string;
  name: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral'; // As per mock data
  change: string; // e.g., "+5%", "-2%"
  keywords: string[];
}

export const fetchTopics = async (): Promise<TopicItem[]> => {
  const response = await fetch('/api/topics');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || 'Failed to fetch topics');
  }
  return response.json();
};

// Type for Sentiment Distribution API response items
export interface SentimentDistributionItem {
  name: string; // e.g., 'Positivo', 'Negativo', 'Neutro'
  value: number; // Percentage value
  count: number; // Actual count
  color: string; // Hex color string provided by backend
}

export const fetchSentimentDistribution = async (): Promise<SentimentDistributionItem[]> => {
  const response = await fetch('/api/sentiment-distribution');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || 'Failed to fetch sentiment distribution');
  }
  return response.json();
};

// Type for Sentiment Trends API response items
export interface SentimentTrendItem {
  date: string; // e.g., "27/04"
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export const fetchSentimentTrends = async (): Promise<SentimentTrendItem[]> => {
  const response = await fetch('/api/sentiment-trends');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || 'Failed to fetch sentiment trends');
  }
  return response.json();
};
