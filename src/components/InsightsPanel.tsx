import React, { useState } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Target, Loader2, Wand2, Pencil, Check, X, PlusCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');

  const { data: insights, isLoading, error } = useQuery<Insight[]>({
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

  const updateInsightMutation = useMutation({
    mutationFn: async ({ insightId, tags }: { insightId: string; tags: string[] }) => {
      const { data, error } = await supabase.from('insights').update({ tags }).eq('id', insightId).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast({ title: 'Sucesso!', description: 'As tags foram atualizadas.' });
      setEditingInsightId(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao atualizar tags', description: err.message, variant: 'destructive' });
    },
  });

  const createOpportunityMutation = useMutation({
      mutationFn: async ({ title, description }: { title: string; description: string | null }) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado.");
          
          const { error } = await supabase.from('product_opportunities').insert({
            title: title,
            description: description,
            user_id: user.id,
            status: 'backlog',
          });
          if (error) throw error;
          return title;
      },
      onSuccess: (title) => {
          toast({ title: "Oportunidade Criada!", description: `"${title}" foi adicionado ao seu roadmap.` });
          queryClient.invalidateQueries({ queryKey: ['product_opportunities'] });
      },
      onError: (err: Error) => {
          toast({ title: "Erro ao criar oportunidade", description: err.message, variant: 'destructive' });
      },
  });

  const handleStartEditing = (insight: Insight) => {
    setEditingInsightId(insight.id);
    setTagInputValue(insight.tags?.join(', ') || '');
  };

  const handleSaveTags = (insightId: string) => {
    const tags = tagInputValue.split(',').map((t) => t.trim()).filter(Boolean);
    updateInsightMutation.mutate({ insightId, tags });
  };

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
                    
                    {editingInsightId === insight.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Tags separadas por vírgula"
                            value={tagInputValue}
                            onChange={(e) => setTagInputValue(e.target.value)}
                            className="bg-white/80 h-8 text-sm flex-grow"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTags(insight.id)}
                          />
                          <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleSaveTags(insight.id)} disabled={updateInsightMutation.isPending}>
                            {updateInsightMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setEditingInsightId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">Pressione Enter para salvar.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {insight.tags && insight.tags.length > 0 ? (
                          insight.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-white/50">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">Sem tags</p>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleStartEditing(insight)}
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Editar tags</span>
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-black border-opacity-5">
                      {insight.action && (
                          <span className="text-xs text-gray-600 italic max-w-[50%]">{insight.action}</span>
                      )}
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createOpportunityMutation.mutate({ title: insight.title, description: insight.description })}
                          disabled={createOpportunityMutation.isPending && createOpportunityMutation.variables?.title === insight.title}
                          className="ml-auto"
                      >
                          {createOpportunityMutation.isPending && createOpportunityMutation.variables?.title === insight.title ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                              <PlusCircle className="mr-2 h-4 w-4" />
                          )}
                          Criar Oportunidade
                      </Button>
                    </div>
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
