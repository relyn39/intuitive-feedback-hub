
import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';

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
