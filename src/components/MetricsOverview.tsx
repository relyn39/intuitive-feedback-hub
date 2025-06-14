
import React from 'react';
import { TrendingUp, TrendingDown, Star, AlertTriangle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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

const MetricCardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
  const { data, isLoading, isError, error } = useQuery<MetricsResponse>({
    queryKey: ['metrics-overview'],
    queryFn: fetchMetrics,
    refetchOnWindowFocus: false,
  });

  const metricsConfig = data ? [
    {
      title: 'Total de Itens',
      value: data.totalItems.value.toLocaleString('pt-BR'),
      change: data.totalItems.change,
      icon: Package,
      color: 'blue',
      unit: '%',
      higherIsBetter: true,
    },
    {
      title: 'Sentimento Positivo',
      value: `${data.positiveSentiment.value.toFixed(1)}%`,
      change: data.positiveSentiment.change,
      icon: Star,
      color: 'green',
      unit: 'pp',
      higherIsBetter: true,
    },
    {
      title: 'Issues Críticos',
      value: data.criticalIssues.value.toLocaleString('pt-BR'),
      change: data.criticalIssues.change,
      icon: AlertTriangle,
      color: 'red',
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

  if (isError) {
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full bg-red-50 text-red-700 p-4 rounded-lg text-center">
                <p className="font-semibold">Ocorreu um erro ao carregar as métricas</p>
                <p className="text-sm">{error?.message}</p>
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

        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${metric.color}-50`}>
                <Icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{`${metric.change.toFixed(1)}${metric.unit}`}</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
