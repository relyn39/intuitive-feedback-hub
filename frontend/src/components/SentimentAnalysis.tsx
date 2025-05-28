import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSentimentDistribution, SentimentDistributionItem } from '@/services/api';

const SentimentAnalysis: React.FC = () => {
  const { data: sentimentData, isLoading, isError, error } = useQuery<SentimentDistributionItem[], Error>({
    queryKey: ['sentimentDistribution'],
    queryFn: fetchSentimentDistribution,
    // staleTime: 5 * 60 * 1000, 
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Skeleton className="h-48 w-48 rounded-full mb-4" /> {/* Pie chart skeleton */}
          <div className="w-full space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 rounded-full mr-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Sentimento</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Análise de Sentimento</AlertTitle>
            <AlertDescription>
              {error?.message || 'Não foi possível buscar os dados de sentimento. Tente novamente mais tarde.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Ensure data is not undefined for the chart
  const chartData = sentimentData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Sentimento</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value" // This 'value' is the percentage from API
                nameKey="name"   // This 'name' is 'Positivo', 'Negativo', 'Neutro'
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${props.payload.count} (${value.toFixed(1)}%)`, name]} />
              <Legend
                formatter={(value, entry) => {
                    const { color, payload } = entry;
                    // 'payload' here refers to the data item for the legend entry
                    // We want to display the name and the original count from the API
                    const dataPoint = chartData.find(d => d.name === (payload as any)?.name);
                    return <span style={{ color }}>{value} ({dataPoint?.count || 0})</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10">Não há dados de sentimento para exibir.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysis;
