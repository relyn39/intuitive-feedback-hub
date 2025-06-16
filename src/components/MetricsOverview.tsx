
import React from 'react';
import { TrendingUp, TrendingDown, Star, AlertTriangle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useDemoMode } from '@/hooks/useDemoMode';

interface MetricData {
  value: number;
  change: number;
}

interface MetricsResponse {
  totalItems: MetricData;
  positiveSentiment: MetricData;
  criticalIssues: MetricData;
}

const fetchMetrics = async (): Promise<MetricsResponse> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase.functions.invoke('calculate-metrics', {
    body: { user_id: user.id },
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Resposta inválida da função de métricas");

  return data;
};

const getDemoMetrics = (): MetricsResponse => {
  return {
    totalItems: {
      value: 247,
      change: 12.5
    },
    positiveSentiment: {
      value: 73.2,
      change: 8.3
    },
    criticalIssues: {
      value: 18,
      change: -15.7
    }
  };
};

const MetricCardSkeleton = () => (
  <div className="bg-card rounded-xl p-6 shadow-sm border">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <Skeleton className="h-6 w-16" />
    </div>
    <div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const MetricsOverview = () => {
  const { isDemoMode } = useDemoMode();

  const { data, isLoading, isError, error } = useQuery<MetricsResponse>({
    queryKey: ['metrics-overview'],
    queryFn: isDemoMode ? getDemoMetrics : fetchMetrics,
    refetchOnWindowFocus: false,
  });

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/50',
      text: 'text-green-600 dark:text-green-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/50',
      text: 'text-red-600 dark:text-red-400',
    },
  };

  const metricsConfig = data ? [
    {
      title: 'Total de Itens',
      value: data.totalItems.value.toLocaleString('pt-BR'),
      change: data.totalItems.change,
      icon: Package,
      color: 'blue' as const,
      unit: '%',
      higherIsBetter: true,
    },
    {
      title: 'Sentimento Positivo',
      value: `${data.positiveSentiment.value.toFixed(1)}%`,
      change: data.positiveSentiment.change,
      icon: Star,
      color: 'green' as const,
      unit: 'pp',
      higherIsBetter: true,
    },
    {
      title: 'Issues Críticos',
      value: data.criticalIssues.value.toLocaleString('pt-BR'),
      change: data.criticalIssues.change,
      icon: AlertTriangle,
      color: 'red' as const,
      unit: '%',
      higherIsBetter: false,
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError && !isDemoMode) {
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full text-center py-10 bg-card rounded-xl shadow-sm border">
                <p className="text-muted-foreground">Não há dados para serem exibidos.</p>
                <p className="text-sm text-muted-foreground mt-1">Tente atualizar os dados ou verifique suas integrações.</p>
            </div>
        </div>
     );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metricsConfig.map((metric, index) => {
        const trendDirection = metric.change >= 0 ? 'up' : 'down';
        const isGoodTrend = metric.higherIsBetter ? trendDirection === 'up' : trendDirection === 'down';
        const TrendIcon = isGoodTrend ? TrendingUp : TrendingDown;
        const trendColor = isGoodTrend ? 'text-green-600' : 'text-red-600';
        const Icon = metric.icon;
        const colors = colorClasses[metric.color];

        return (
          <div key={index} className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{`${metric.change.toFixed(1)}${metric.unit}`}</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-card-foreground mb-1">{metric.value}</h3>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
