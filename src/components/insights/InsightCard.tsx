import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Insight } from '@/types/insights';
import { EditInsightTags } from './EditInsightTags';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Pencil, TrendingUp, AlertCircle, Target, Lightbulb } from 'lucide-react';

const iconMap = {
  trend: TrendingUp,
  alert: AlertCircle,
  opportunity: Target,
  other: Lightbulb,
};

interface InsightCardProps {
  insight: Insight;
}

export const InsightCard = ({ insight }: InsightCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateInsightMutation = useMutation({
    mutationFn: async ({ insightId, tags }: { insightId: string; tags: string[] }) => {
      const { data, error } = await supabase.from('insights').update({ tags }).eq('id', insightId).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast({ title: 'Sucesso!', description: 'As tags foram atualizadas.' });
      setIsEditing(false);
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

  const handleSaveTags = (tagInputValue: string) => {
    const tags = tagInputValue.split(',').map((t) => t.trim()).filter(Boolean);
    updateInsightMutation.mutate({ insightId: insight.id, tags });
  };
  
  const Icon = iconMap[insight.type] || Lightbulb;
  const severityColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[insight.severity]}`}>
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
          <p className="text-sm opacity-90 mb-2">{insight.description}</p>
          
          {isEditing ? (
            <EditInsightTags
              initialValue={insight.tags?.join(', ') || ''}
              onSave={handleSaveTags}
              onCancel={() => setIsEditing(false)}
              isSaving={updateInsightMutation.isPending}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {insight.tags && insight.tags.length > 0 ? (
                insight.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-background/50">
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Sem tags</p>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
                <span className="sr-only">Editar tags</span>
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/10">
            {insight.action && (
                <span className="text-xs text-muted-foreground italic max-w-[50%]">{insight.action}</span>
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
};
