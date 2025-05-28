import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // For error state
import { AlertTriangle, ArrowUp, ArrowDown, Minus, Users, MessageSquare, Smile, TrendingUp, Bug, ThumbsUp } from 'lucide-react'; // Icons
import { useQuery } from '@tanstack/react-query';
import { fetchMetricsOverview, MetricItem } from '@/services/api'; // Assuming api.ts is in src/services

// Helper to map titles to icons and colors (frontend decision for now)
const getMetricVisuals = (title: string): { icon: React.ElementType, color: string } => {
  switch (title) {
    case 'Total de Feedbacks':
      return { icon: MessageSquare, color: 'text-blue-500' };
    case 'Sentimento Positivo':
      return { icon: Smile, color: 'text-green-500' };
    case 'Usuários Ativos': // This metric is mocked in backend, icon choice is frontend
      return { icon: Users, color: 'text-purple-500' };
    case 'Issues Críticos':
      return { icon: AlertTriangle, color: 'text-red-500' };
    default:
      return { icon: TrendingUp, color: 'text-gray-500' }; // Default icon
  }
};

const MetricsOverview: React.FC = () => {
  const { data: metrics, isLoading, isError, error } = useQuery<MetricItem[], Error>({
    queryKey: ['metricsOverview'],
    queryFn: fetchMetricsOverview,
    // Optional: configure staleTime, cacheTime, retry, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-3/4" /> {/* Title skeleton */}
              <Skeleton className="h-6 w-6" />   {/* Icon skeleton */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" /> {/* Value skeleton */}
              <Skeleton className="h-4 w-full" />    {/* Change text skeleton */}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Métricas</AlertTitle>
        <AlertDescription>
          {error?.message || 'Não foi possível buscar os dados das métricas. Tente novamente mais tarde.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics?.map((metric) => {
        const { icon: IconComponent, color } = getMetricVisuals(metric.title);
        const TrendIcon = metric.trend === 'up' ? ArrowUp : metric.trend === 'down' ? ArrowDown : Minus;
        
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <IconComponent className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendIcon className={`h-3 w-3 mr-1 ${
                  metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`} />
                {metric.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricsOverview;
