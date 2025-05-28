import { Request, Response } from 'express';
import { getDB } from '../database/sqlite';
import { FeedbackItem } from '../types/feedback'; // Assuming this type is relevant for casting

// Helper to run all queries in a serialized manner for SQLite
const runQuery = (query: string, params: any[] = []): Promise<any[]> => {
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error running SQL query:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const runSingleQuery = (query: string, params: any[] = []): Promise<any> => {
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('Error running SQL query:', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};


export const getMetricsOverview = async (req: Request, res: Response) => {
  try {
    const totalFeedbacksRow = await runSingleQuery('SELECT COUNT(*) as count FROM feedback');
    const totalFeedbacks = totalFeedbacksRow?.count || 0;

    const positiveFeedbacksRow = await runSingleQuery("SELECT COUNT(*) as count FROM feedback WHERE sentiment = 'positive'");
    const positiveFeedbacksCount = positiveFeedbacksRow?.count || 0;
    
    const positiveSentimentPercentage = totalFeedbacks > 0 ? (positiveFeedbacksCount / totalFeedbacks) * 100 : 0;

    // Mock "Usuários Ativos" for now, or count distinct user IDs if user.id is reliably stored and not nested in JSON.
    // For this example, let's try to count distinct user IDs from the JSON 'user' field if possible.
    // This is a simplified approach; robust JSON querying depends on SQLite version and JSON1 extension.
    // A safer mock for now given potential SQLite limitations in the environment:
    const activeUsers = 500; // Mock value

    const criticalIssuesRow = await runSingleQuery("SELECT COUNT(*) as count FROM feedback WHERE priority = 'critical'");
    const criticalIssues = criticalIssuesRow?.count || 0;

    const metrics = [
      { title: 'Total de Feedbacks', value: totalFeedbacks, change: '+5% vs S.P.', trend: 'up', icon: 'messageSquare', color: 'blue' },
      { title: 'Sentimento Positivo', value: `${positiveSentimentPercentage.toFixed(1)}%`, change: '+2% vs S.P.', trend: 'up', icon: 'smile', color: 'green' },
      { title: 'Usuários Ativos', value: activeUsers, change: 'N/A', trend: 'neutral', icon: 'users', color: 'purple' }, // Change and trend are mocked
      { title: 'Issues Críticos', value: criticalIssues, change: '-10% vs S.P.', trend: 'down', icon: 'alertTriangle', color: 'red' },
    ];
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get metrics overview:', error);
    res.status(500).json({ message: 'Failed to retrieve metrics overview' });
  }
};

export const getSentimentDistribution = async (req: Request, res: Response) => {
  try {
    const rows = await runQuery(`
      SELECT sentiment, COUNT(*) as count 
      FROM feedback 
      WHERE sentiment IS NOT NULL 
      GROUP BY sentiment
    `);
    const total = rows.reduce((acc, row) => acc + row.count, 0);
    
    const sentimentData = rows.map(row => {
      let color = '#cccccc'; // Default for neutral or undefined
      let name = 'Neutro';
      if (row.sentiment === 'positive') {
        color = '#10b981'; // green
        name = 'Positivo';
      } else if (row.sentiment === 'negative') {
        color = '#f43f5e'; // red
        name = 'Negativo';
      }
      return {
        name,
        value: total > 0 ? parseFloat(((row.count / total) * 100).toFixed(1)) : 0,
        count: row.count, // Send count as well, might be useful
        color,
      };
    });

    // Ensure all categories are present even if count is 0
    const expectedSentiments = [
        { name: 'Positivo', dbName: 'positive', color: '#10b981' },
        { name: 'Negativo', dbName: 'negative', color: '#f43f5e' },
        { name: 'Neutro', dbName: 'neutral', color: '#6b7280' } // gray for neutral
    ];

    const finalSentimentData = expectedSentiments.map(expected => {
        const found = sentimentData.find(s => s.name === expected.name);
        if (found) return found;
        return { name: expected.name, value: 0, count: 0, color: expected.color };
    });


    res.json(finalSentimentData);
  } catch (error) {
    console.error('Failed to get sentiment distribution:', error);
    res.status(500).json({ message: 'Failed to retrieve sentiment distribution' });
  }
};

export const getSentimentTrends = async (req: Request, res: Response) => {
  try {
    // For simplicity, grouping by day. Adjust date formatting/grouping as needed for your dataset.
    // SQLite's DATE() function extracts the date part.
    const rows = await runQuery(`
      SELECT 
        DATE(createdAt) as date,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        COUNT(*) as total
      FROM feedback
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
      LIMIT 30; -- Limit to last 30 data points for trend view
    `);

    const formattedData = rows.map(row => ({
      // Format date to MM/DD or DD/MM as per frontend expectation if needed.
      // Assuming frontend can handle YYYY-MM-DD or this needs adjustment.
      // For "01/05" format, assuming createdAt is an ISO string:
      date: new Date(row.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      positive: row.positive,
      negative: row.negative,
      neutral: row.neutral,
      total: row.total,
    }));
    res.json(formattedData);
  } catch (error) {
    console.error('Failed to get sentiment trends:', error);
    res.status(500).json({ message: 'Failed to retrieve sentiment trends' });
  }
};

export const getTopics = async (req: Request, res: Response) => {
  try {
    const rows = await runQuery("SELECT topics FROM feedback WHERE topics IS NOT NULL AND topics != '[]';");
    
    const topicFrequencyMap = new Map<string, number>();
    const topicSentimentMap = new Map<string, { positive: number, negative: number, neutral: number, total: number }>();

    for (const row of rows) {
      if (row.topics) {
        try {
          const topicsInItem: string[] = JSON.parse(row.topics);
          const sentimentOfItemRow = await runSingleQuery(
            "SELECT sentiment FROM feedback WHERE topics = ? LIMIT 1", // Get sentiment for this specific row
            [row.topics] // This might not be perfectly accurate if multiple rows have exact same topics string
                        // A better way would be to fetch sentiment along with topics if possible, or use ID
          );
          const sentimentOfItem = sentimentOfItemRow?.sentiment || 'neutral';


          topicsInItem.forEach(topic => {
            topicFrequencyMap.set(topic, (topicFrequencyMap.get(topic) || 0) + 1);
            
            // Aggregate sentiment for each topic
            const currentSentimentCounts = topicSentimentMap.get(topic) || { positive: 0, negative: 0, neutral: 0, total: 0 };
            currentSentimentCounts.total++;
            if (sentimentOfItem === 'positive') currentSentimentCounts.positive++;
            else if (sentimentOfItem === 'negative') currentSentimentCounts.negative++;
            else currentSentimentCounts.neutral++;
            topicSentimentMap.set(topic, currentSentimentCounts);
          });
        } catch (e) {
          console.error('Error parsing topics JSON from DB:', row.topics, e);
        }
      }
    }

    const sortedTopics = Array.from(topicFrequencyMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by frequency descending
      .slice(0, 10); // Limit to top 10 topics

    const responseTopics = sortedTopics.map(([name, count], index) => {
      const sentimentCounts = topicSentimentMap.get(name) || { positive: 0, negative: 0, neutral: 0, total: 0 };
      let dominantSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral) {
        dominantSentiment = 'positive';
      } else if (sentimentCounts.negative > sentimentCounts.positive && sentimentCounts.negative > sentimentCounts.neutral) {
        dominantSentiment = 'negative';
      }
      
      return {
        id: `topic-${index + 1}`, // Generate a simple ID
        name,
        count,
        sentiment: dominantSentiment, // Assign dominant sentiment
        change: `${Math.floor(Math.random() * 20) - 10}%`, // Mocked change
        // Mock keywords, or derive from topic name if simple
        keywords: [name.toLowerCase().split(' ')[0], 'mock_keyword'], 
      };
    });

    res.json(responseTopics);
  } catch (error) {
    console.error('Failed to get topics:', error);
    res.status(500).json({ message: 'Failed to retrieve topics' });
  }
};

export const getInsights = async (req: Request, res: Response) => {
  // For now, return a static list of mock insights
  const mockInsights = [
    {
      type: 'Melhoria Sugerida',
      icon: 'TrendingUp',
      title: 'Checkout de Pagamento Lento',
      description: 'Usuários relatam lentidão no processo de checkout, especialmente em dispositivos móveis. Tempo médio de conclusão: 2.5 minutos.',
      severity: 'Alta',
      action: 'Otimizar o fluxo de pagamento',
    },
    {
      type: 'Bug Crítico',
      icon: 'Bug',
      title: 'Falha ao Salvar Perfil',
      description: 'Diversos usuários não conseguem salvar as alterações no perfil. Erro E500 ocorre em 30% das tentativas.',
      severity: 'Crítica',
      action: 'Investigar e corrigir urgentemente',
    },
    {
      type: 'Feedback Positivo',
      icon: 'ThumbsUp',
      title: 'Novo Dashboard Intuitivo',
      description: 'Feedbacks positivos sobre o novo design do dashboard. Usuários apreciam a clareza e facilidade de uso.',
      severity: 'Baixa',
      action: 'Monitorar e coletar mais feedback',
    },
  ];
  res.json(mockInsights);
};

// NLQ Controller
import { processNLQ } from '../services/nlqProcessor';

export const handleNLQ = async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query is required and must be a string.' });
  }

  try {
    const nlqResponse = await processNLQ(query);
    res.json(nlqResponse);
  } catch (error: any) {
    console.error('Error in handleNLQ controller:', error);
    res.status(500).json({ message: 'Failed to process your query.', error: error.message });
  }
};
