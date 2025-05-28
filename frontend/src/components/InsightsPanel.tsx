import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Bug, ThumbsUp, Lightbulb, Zap } from 'lucide-react'; // Common icons
import { useQuery } from '@tanstack/react-query';
import { fetchInsights, InsightItem } from '@/services/api';

// Helper to map icon names (strings) from API to Lucide icon components
const getIconComponent = (iconName?: string): React.ElementType => {
  switch (iconName) {
    case 'TrendingUp':
      return TrendingUp;
    case 'Bug':
      return Bug;
    case 'ThumbsUp':
      return ThumbsUp;
    case 'Lightbulb':
      return Lightbulb;
    case 'Zap':
        return Zap;
    default:
      return Lightbulb; // Default icon
  }
};

// Helper to get styling based on severity
const getSeverityStyles = (severity?: string): { bg: string; text: string; border: string } => {
  switch (severity?.toLowerCase()) {
    case 'crítica':
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-500' };
    case 'alta':
      return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500' };
    case 'média':
      return { bg: 'bg-yellow-100 dark:bg-yellow-800/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500' };
    case 'baixa':
      return { bg: 'bg-green-100 dark:bg-green-800/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-500' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-400' };
  }
};

const InsightsPanel: React.FC = () => {
  const { data: insights, isLoading, isError, error } = useQuery<InsightItem[], Error>({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    // staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-1/3" /> {/* Title skeleton */}
          <Skeleton className="h-8 w-1/4" /> {/* Button skeleton */}
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, index) => ( // Skeleton for 2 items
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start mb-2">
                <Skeleton className="h-6 w-6 mr-3 rounded-sm" /> {/* Icon skeleton */}
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-1" /> {/* Title skeleton */}
                  <Skeleton className="h-4 w-full" />    {/* Description line 1 skeleton */}
                  <Skeleton className="h-4 w-5/6 mt-1" /> {/* Description line 2 skeleton */}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-1/4" /> {/* Severity skeleton */}
                <Skeleton className="h-5 w-1/3" /> {/* Action skeleton */}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights Acionáveis</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Insights</AlertTitle>
            <AlertDescription>
              {error?.message || 'Não foi possível buscar os insights. Tente novamente mais tarde.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Insights Acionáveis</CardTitle>
        <Button variant="outline" size="sm" disabled> {/* Disabled as per current scope */}
          Ver todos os insights
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights && insights.length > 0 ? (
          insights.slice(0, 3).map((insight, index) => { // Displaying up to 3 insights for brevity
            const IconComponent = getIconComponent(insight.icon);
            const severityStyles = getSeverityStyles(insight.severity);
            return (
              <div key={index} className={`p-4 rounded-lg border ${severityStyles.bg} ${severityStyles.border}`}>
                <div className="flex items-start mb-2">
                  <IconComponent className={`h-5 w-5 mr-3 ${severityStyles.text}`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${severityStyles.text}`}>{insight.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`${severityStyles.text} font-medium`}>Severidade: {insight.severity}</span>
                  <span className="text-blue-600 hover:underline cursor-pointer">
                    {insight.action}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum insight encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;
