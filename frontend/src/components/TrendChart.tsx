import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSentimentTrends, SentimentTrendItem } from '@/services/api';

const TrendChart: React.FC = () => {
  const { data: trendData, isLoading, isError, error } = useQuery<SentimentTrendItem[], Error>({
    queryKey: ['sentimentTrends'],
    queryFn: fetchSentimentTrends,
    // staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" /> {/* Title skeleton */}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" /> {/* Chart area skeleton */}
          <div className="flex justify-around mt-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Sentimento</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Tendência de Sentimento</AlertTitle>
            <AlertDescription>
              {error?.message || 'Não foi possível buscar os dados de tendência. Tente novamente mais tarde.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Ensure data is not undefined for the chart
  const chartData = trendData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Sentimento (Últimos 30 Pontos)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="positive" name="Positivo" stroke="#10b981" fillOpacity={1} fill="url(#colorPositive)" />
              <Area type="monotone" dataKey="negative" name="Negativo" stroke="#f43f5e" fillOpacity={1} fill="url(#colorNegative)" />
              <Area type="monotone" dataKey="neutral" name="Neutro" stroke="#6b7280" fillOpacity={1} fill="url(#colorNeutral)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10">Não há dados de tendência para exibir.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
