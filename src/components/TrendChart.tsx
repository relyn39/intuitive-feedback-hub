
import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const processChartData = (feedbacks: any[]) => {
  if (!feedbacks) return [];

  const sentimentByDay: Map<string, { positive: number; negative: number; neutral: number }> = new Map();

  // Initialize map for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'dd/MM');
    sentimentByDay.set(formattedDate, { positive: 0, negative: 0, neutral: 0 });
  }

  feedbacks.forEach(fb => {
    if (fb.analysis && typeof fb.analysis === 'object' && 'sentiment' in fb.analysis) {
      const sentiment = (fb.analysis as any).sentiment;
      if (['positive', 'negative', 'neutral'].includes(sentiment)) {
        const date = new Date(fb.created_at);
        const formattedDate = format(date, 'dd/MM');
        
        if (sentimentByDay.has(formattedDate)) {
          const dayData = sentimentByDay.get(formattedDate)!;
          dayData[sentiment as 'positive' | 'negative' | 'neutral']++;
        }
      }
    }
  });

  return Array.from(sentimentByDay.entries()).map(([date, counts]) => ({
    date,
    ...counts
  }));
};

export const TrendChart = () => {
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks-trend'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(startOfDay(new Date()), 6);
      const { data, error } = await supabase
        .from('feedbacks')
        .select('created_at, analysis')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const chartData = React.useMemo(() => processChartData(feedbacks), [feedbacks]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Análise de Sentimento - Últimos 7 dias</h3>
          <p className="text-sm text-gray-600">Distribuição e tendências do sentimento dos feedbacks</p>
        </div>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Positivo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Negativo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600">Neutro</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : !chartData || chartData.every(d => d.positive === 0 && d.negative === 0 && d.neutral === 0) ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <p className="text-gray-600">Não há dados de sentimento para os últimos 7 dias.</p>
            <p className="text-sm text-gray-500 mt-1">Analise alguns feedbacks para ver o gráfico.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="positive" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorPositive)"
                strokeWidth={2}
                name="Positivo"
              />
              <Area 
                type="monotone" 
                dataKey="negative" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorNegative)"
                strokeWidth={2}
                name="Negativo"
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="#6b7280" 
                strokeWidth={2}
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
                name="Neutro"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
