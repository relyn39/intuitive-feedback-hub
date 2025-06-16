
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDemoMode } from '@/hooks/useDemoMode';

const SENTIMENT_CONFIG = {
  positive: { name: 'Positivo', color: '#10b981' },
  neutral: { name: 'Neutro', color: '#6b7280' },
  negative: { name: 'Negativo', color: '#ef4444' },
};

type Sentiment = keyof typeof SENTIMENT_CONFIG;

export const SentimentAnalysis = () => {
  const { isDemoMode, getDemoFeedbacks } = useDemoMode();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['sentiments'],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoFeedbacks().map(fb => ({ analysis: fb.analysis }));
      }
      const { data, error } = await supabase.from('feedbacks').select('analysis');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-card-foreground mb-6">Distribuição de Sentimento</h3>
        <div className="flex justify-center items-center h-48">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        <div className="space-y-3 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  const sentimentCounts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  let totalAnalyzed = 0;

  feedbacks?.forEach(fb => {
    if (
      fb.analysis &&
      typeof fb.analysis === 'object' &&
      'sentiment' in fb.analysis &&
      typeof (fb.analysis as any).sentiment === 'string'
    ) {
      const sentiment = (fb.analysis as any).sentiment as Sentiment;
      if (sentiment in sentimentCounts) {
        sentimentCounts[sentiment]++;
        totalAnalyzed++;
      }
    }
  });

  if (totalAnalyzed === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border flex flex-col items-center justify-center h-full min-h-[350px]">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">Distribuição de Sentimento</h3>
        <p className="text-sm text-muted-foreground text-center">Nenhum feedback analisado ainda.</p>
        <p className="text-xs text-muted-foreground mt-2 text-center">Clique em "Analisar" na lista de feedbacks para começar a ver os dados aqui.</p>
      </div>
    );
  }

  const sentimentData = (Object.keys(sentimentCounts) as Sentiment[])
    .map(sentiment => ({
      name: SENTIMENT_CONFIG[sentiment].name,
      value: parseFloat(((sentimentCounts[sentiment] / totalAnalyzed) * 100).toFixed(1)),
      color: SENTIMENT_CONFIG[sentiment].color,
    }))
    .filter(item => item.value > 0);

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-card-foreground mb-6 flex items-center gap-2">
        Distribuição de Sentimento
        {isDemoMode && (
          <Badge variant="outline" className="text-xs">DEMO</Badge>
        )}
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sentimentData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--card-foreground))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3 mt-4">
        {sentimentData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-card-foreground">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
