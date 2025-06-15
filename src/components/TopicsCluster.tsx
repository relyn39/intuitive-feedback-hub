
import React from 'react';
import { Hash, ArrowUp, ArrowDown, Minus, PlusCircle, Loader2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Topic {
  id: number;
  name: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  change: number;
  keywords: string[];
}

const fetchLatestTopics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from('topic_analysis_results')
        .select('topics')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) {
        throw new Error(error.message);
    }

    return data?.topics ?? null;
};

const analyzeNewTopics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.functions.invoke('analyze-topics', {
        body: { user_id: user.id },
    });
    if (error) throw new Error(error.message);
};

export const TopicsCluster = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: topics, isLoading, isError, error } = useQuery<Topic[] | null>({
        queryKey: ['latest-topics'],
        queryFn: fetchLatestTopics,
    });

    const analyzeTopicsMutation = useMutation({
        mutationFn: analyzeNewTopics,
        onSuccess: () => {
            toast({ title: "Análise concluída!", description: "Os tópicos foram atualizados com base nos novos feedbacks." });
            queryClient.invalidateQueries({ queryKey: ['latest-topics'] });
        },
        onError: (err: Error) => {
            toast({ title: "Erro na Análise", description: err.message, variant: 'destructive' });
        },
    });

    const createOpportunityMutation = useMutation({
        mutationFn: async (topicName: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");
            
            const { error } = await supabase.from('product_opportunities').insert({
              title: topicName,
              user_id: user.id,
              status: 'backlog',
            });
            if (error) throw error;
            return topicName;
        },
        onSuccess: (topicName) => {
            toast({ title: "Oportunidade Criada!", description: `"${topicName}" foi adicionado ao seu roadmap.` });
            queryClient.invalidateQueries({ queryKey: ['product_opportunities'] });
        },
        onError: (err: Error) => {
            toast({ title: "Erro ao criar oportunidade", description: err.message, variant: 'destructive' });
        },
    });

    return (
        <div className="bg-card rounded-xl p-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-card-foreground">Tópicos Mais Discutidos</h3>
                    <p className="text-sm text-muted-foreground">Transforme tópicos em oportunidades para seu roadmap</p>
                </div>
                <Button 
                    onClick={() => analyzeTopicsMutation.mutate()}
                    disabled={analyzeTopicsMutation.isPending}
                >
                    {analyzeTopicsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Analisar Tópicos
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading && (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
                )}

                {!isLoading && (isError || (!topics || topics.length === 0)) && (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">
                            {isError ? "Ocorreu um erro ao buscar os tópicos." : "Nenhuma análise de tópicos encontrada."}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isError ? error.message : "Clique em \"Analisar Tópicos\" para gerar a primeira análise."}
                        </p>
                    </div>
                )}
                
                {!isLoading && !isError && topics && topics.map((topic) => {
                    const sentimentColors = {
                        positive: 'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800',
                        negative: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
                        neutral: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                    };

                    const ChangeIcon = topic.change > 0 ? ArrowUp : topic.change < 0 ? ArrowDown : Minus;
                    const changeColor = topic.change > 0 ? 'text-green-600' : topic.change < 0 ? 'text-red-600' : 'text-muted-foreground';

                    return (
                        <div key={topic.id} className={`p-4 rounded-lg border ${sentimentColors[topic.sentiment as keyof typeof sentimentColors]}`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                                <div className="flex items-center space-x-3">
                                    <Hash className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <h4 className="font-medium text-card-foreground">{topic.name}</h4>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-foreground">{topic.count.toLocaleString()} menções</span>
                                    <div className={`flex items-center space-x-1 ${changeColor}`}>
                                        <ChangeIcon className="w-3 h-3" />
                                        <span className="text-xs font-medium">{Math.abs(topic.change)}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {topic.keywords.map((keyword, index) => (
                                    <span key={index} className="px-2 py-1 bg-background/60 text-xs text-foreground rounded-md">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="flex justify-end">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => createOpportunityMutation.mutate(topic.name)}
                                    disabled={createOpportunityMutation.isPending && createOpportunityMutation.variables === topic.name}
                                >
                                  {createOpportunityMutation.isPending && createOpportunityMutation.variables === topic.name ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Criar Oportunidade
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
