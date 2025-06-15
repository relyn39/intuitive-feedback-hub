
import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';
import { Integration, SyncLog, IntegrationSource, IntegrationConfig } from '@/components/integrations/types';

export const syncIntegrations = async (queryClient: QueryClient) => {
  const { data: integrations, error: integrationsError } = await supabase
    .from('integrations')
    .select('id, source')
    .eq('is_active', true);

  if (integrationsError) throw integrationsError;

  if (!integrations || integrations.length === 0) {
    throw new Error("Nenhuma integração ativa para sincronizar.");
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
  }

  const syncPromises = integrations.map(async (integration) => {
    const functionName = `${integration.source}-sync`;
    const { error } = await supabase.functions.invoke(functionName, {
      body: { integrationId: integration.id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) {
      console.error(`Error syncing ${integration.source}:`, error);
      throw new Error(`Falha ao sincronizar ${integration.source}.`);
    }
  });
  
  await Promise.all(syncPromises);
  
  await queryClient.invalidateQueries();
};

export const fetchIntegrations = async (): Promise<Integration[]> => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Integration[]) || [];
};

export const fetchSyncLogs = async (): Promise<SyncLog[]> => {
  const { data, error } = await supabase
    .from('sync_logs')
    .select(`*, integrations(name, source)`)
    .order('started_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as SyncLog[]) || [];
};

export const createIntegration = async (newIntegration: { source: IntegrationSource; name: string; config: IntegrationConfig }) => {
  if (!newIntegration.source || !newIntegration.name) {
    throw new Error("Preencha todos os campos obrigatórios");
  }
  const { data, error } = await supabase.from('integrations').insert({
    source: newIntegration.source,
    name: newIntegration.name,
    config: newIntegration.config,
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateIntegration = async (integrationToUpdate: Integration) => {
  const { data, error } = await supabase
    .from('integrations')
    .update({
      name: integrationToUpdate.name,
      sync_frequency: integrationToUpdate.sync_frequency,
      config: integrationToUpdate.config,
    })
    .eq('id', integrationToUpdate.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteIntegration = async (id: string) => {
  const { error } = await supabase.from('integrations').delete().eq('id', id);
  if (error) throw error;
};

export const syncIntegration = async (integration: Integration) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const functionName = `${integration.source}-sync`;
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { integrationId: integration.id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    return data;
};

