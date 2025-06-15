
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Integration } from '@/components/integrations/types';
import * as integrationService from '@/services/integrationService';

export const useIntegrations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationService.fetchIntegrations,
  });

  const { data: syncLogs, isLoading: isLoadingSyncLogs } = useQuery({
    queryKey: ['syncLogs'],
    queryFn: integrationService.fetchSyncLogs,
  });

  const createIntegrationMutation = useMutation({
    mutationFn: integrationService.createIntegration,
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Integração criada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Falha ao criar integração", variant: "destructive" });
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: integrationService.updateIntegration,
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Integração atualizada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar integração", variant: "destructive" });
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: integrationService.deleteIntegration,
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Integração deletada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Falha ao deletar integração", variant: "destructive" });
    },
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: integrationService.syncIntegration,
    onSuccess: (data) => {
      const createdCount = data?.created ?? 0;
      const updatedCount = data?.updated ?? 0;
      toast({ title: "Sucesso", description: `Sincronização concluída: ${createdCount} criados, ${updatedCount} atualizados` });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['syncLogs'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: `Falha na sincronização: ${error.message}`, variant: "destructive" });
    },
  });

  return { 
    integrations: integrations ?? [], 
    syncLogs: syncLogs ?? [], 
    isLoading: isLoadingIntegrations || isLoadingSyncLogs,
    createIntegration: createIntegrationMutation,
    updateIntegration: updateIntegrationMutation,
    deleteIntegration: deleteIntegrationMutation,
    syncIntegration: syncIntegrationMutation
  };
};

