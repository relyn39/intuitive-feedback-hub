import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Target, Loader2, Wand2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Insight {
  id: string;
  user_id: string;
  type: 'trend' | 'alert' | 'opportunity' | 'other';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  action: string | null;
  created_at: string;
  tags: string[] | null;
}

const iconMap = {
  trend: TrendingUp,
  alert: AlertCircle,
  opportunity: Target,
  other: Lightbulb,
};

const fetchInsights = async (): Promise<Insight[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const generateInsights = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { user_id: user.id }
    });

    if (error) {
        throw new Error(`Falha ao gerar insights: ${error.message}`);
    }
    
    if (data?.message) {
      console.log(data.message)
    }

    return data;
};

export const InsightsPanel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
  });

  const mutation = useMutation({
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
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} size="sm">
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Gerar Novos Insights
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {!isLoading && (error || !insights || insights.length === 0) && (
        <div className="text-center py-16">
            <p className="text-gray-500 font-medium">Nenhum insight para exibir.</p>
            <p className="text-sm text-gray-400 mt-2">Clique em "Gerar Novos Insights" para começar.</p>
        </div>
      )}

      {!isLoading && !error && insights && insights.length > 0 && (
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = iconMap[insight.type] || Lightbulb;
            const severityColors = {
              info: 'bg-blue-50 border-blue-200 text-blue-800',
              warning: 'bg-orange-50 border-orange-200 text-orange-800',
              success: 'bg-green-50 border-green-200 text-green-800',
              error: 'bg-red-50 border-red-200 text-red-800'
            };

            return (
              <div key={insight.id} className={`p-4 rounded-lg border ${severityColors[insight.severity]}`}>
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm opacity-90 mb-2">{insight.description}</p>
                    {insight.tags && insight.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {insight.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs bg-white/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {insight.action && (
                      <button className="text-xs font-medium px-2 py-1 bg-white bg-opacity-70 rounded hover:bg-opacity-100 transition-colors">
                        {insight.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
