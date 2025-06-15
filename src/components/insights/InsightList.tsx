import React from 'react';
import { Insight } from '@/types/insights';
import { InsightCard } from './InsightCard';
import { Loader2 } from 'lucide-react';

interface InsightListProps {
  insights: Insight[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const InsightList = ({ insights, isLoading, error }: InsightListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !insights || insights.length === 0) {
    return (
      <div className="text-center py-16">
          <p className="font-medium text-muted-foreground">{error ? "Erro ao carregar insights." : "Nenhum insight para exibir."}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ? error.message : 'Clique em "Gerar Novos Insights" para começar.'}
          </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
};
