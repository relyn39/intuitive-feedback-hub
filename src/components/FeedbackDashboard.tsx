
import React, { useState } from 'react';
import { MetricsOverview } from './MetricsOverview';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TopicsCluster } from './TopicsCluster';
import { NaturalLanguageQuery } from './NaturalLanguageQuery';
import { InsightsPanel } from './InsightsPanel';
import { TrendChart } from './TrendChart';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { syncIntegrations } from '@/services/integrationService';

export const FeedbackDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    toast({
      title: "Atualizando dados...",
      description: "Buscando as informações mais recentes das suas integrações.",
    });

    try {
      await syncIntegrations(queryClient);

      toast({
        title: "Sucesso!",
        description: "Os dados foram atualizados com sucesso.",
      });

    } catch (error: any) {
      if (error.message === "Nenhuma integração ativa para sincronizar.") {
        toast({
          title: "Nenhuma integração ativa",
          description: "Não há integrações ativas para sincronizar.",
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: error.message || "Não foi possível buscar os dados. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Feedback</h1>
          <p className="text-muted-foreground mt-1">Análise inteligente de feedback dos usuários em tempo real</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Dados'
            )}
          </Button>
        </div>
      </div>

      <MetricsOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NaturalLanguageQuery />
        <InsightsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <SentimentAnalysis />
      </div>

      <TopicsCluster />
    </div>
  );
};
