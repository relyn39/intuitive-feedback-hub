
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Integration, SyncLog, IntegrationSource, IntegrationConfig } from '@/components/integrations/types';

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Erro", description: "Falha ao carregar integrações", variant: "destructive" });
      return;
    }
    setIntegrations(data as Integration[] || []);
  }, [toast]);

  const fetchSyncLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('sync_logs')
      .select(`*, integrations(name, source)`)
      .order('started_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error('Error fetching sync logs:', error);
      return;
    }
    setSyncLogs(data as SyncLog[] || []);
  }, []);

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, [fetchIntegrations, fetchSyncLogs]);

  const createIntegration = async (newIntegration: { source: IntegrationSource; name: string; config: IntegrationConfig }) => {
    if (!newIntegration.source || !newIntegration.name) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return false;
    }
    setLoading(true);
    const { error } = await supabase.from('integrations').insert({
      source: newIntegration.source,
      name: newIntegration.name,
      config: newIntegration.config,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: "Falha ao criar integração", variant: "destructive" });
      return false;
    } else {
      toast({ title: "Sucesso", description: "Integração criada com sucesso" });
      fetchIntegrations();
      return true;
    }
  };

  const updateIntegration = async (integrationToUpdate: Integration) => {
    setLoading(true);
    const { error } = await supabase
      .from('integrations')
      .update({
        name: integrationToUpdate.name,
        sync_frequency: integrationToUpdate.sync_frequency,
        config: integrationToUpdate.config,
      })
      .eq('id', integrationToUpdate.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: "Falha ao atualizar integração", variant: "destructive" });
      return false;
    } else {
      toast({ title: "Sucesso", description: "Integração atualizada com sucesso" });
      fetchIntegrations();
      return true;
    }
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await supabase.from('integrations').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: "Falha ao deletar integração", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Integração deletada com sucesso" });
      fetchIntegrations();
    }
  };

  const syncIntegration = async (integration: Integration) => {
    setSyncing(integration.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const functionName = `${integration.source}-sync`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { integrationId: integration.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      toast({ title: "Sucesso", description: `Sincronização concluída: ${data.created} criados, ${data.updated} atualizados` });
      fetchSyncLogs();
      fetchIntegrations();
    } catch (error: any) {
      toast({ title: "Erro", description: `Falha na sincronização: ${error.message}`, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  return { integrations, syncLogs, loading, syncing, createIntegration, updateIntegration, deleteIntegration, syncIntegration };
};
