
import React from 'react';
import { Lightbulb, Loader2, Wand2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Insight } from '@/types/insights';
import { InsightList } from './insights/InsightList';
import { fetchInsights, generateInsights } from '@/services/insightsService';

export const InsightsPanel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: insights, isLoading, error } = useQuery<Insight[], Error>({
    queryKey: ['insights'],
    queryFn: fetchInsights,
  });

  const generateInsightsMutation = useMutation({
    mutationFn: generateInsights,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Os novos insights estão sendo carregados." });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao gerar insights", description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Insights Automáticos</h3>
        </div>
        <Button onClick={() => generateInsightsMutation.mutate()} disabled={generateInsightsMutation.isPending} size="sm">
          {generateInsightsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Gerar Novos Insights
        </Button>
      </div>

      <InsightList insights={insights} isLoading={isLoading} error={error} />
    </div>
  );
};
