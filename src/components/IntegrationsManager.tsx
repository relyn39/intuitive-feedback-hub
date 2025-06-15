
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Integration, IntegrationSource, IntegrationConfig } from './integrations/types';
import { NewIntegrationDialog } from './integrations/NewIntegrationDialog';
import { EditIntegrationDialog } from './integrations/EditIntegrationDialog';
import { IntegrationsList } from './integrations/IntegrationsList';
import { SyncLogsList } from './integrations/SyncLogsList';

export const IntegrationsManager = () => {
  const { 
    integrations, 
    syncLogs, 
    isLoading,
    createIntegration, 
    updateIntegration, 
    deleteIntegration, 
    syncIntegration 
  } = useIntegrations();

  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = (integration: Integration) => {
    setEditingIntegration(integration);
    setIsEditModalOpen(true);
  };

  const handleCreate = async (newIntegration: { source: IntegrationSource; name: string; config: IntegrationConfig }) => {
    try {
      await createIntegration.mutateAsync(newIntegration);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleUpdate = async (integrationToUpdate: Integration) => {
    try {
      await updateIntegration.mutateAsync(integrationToUpdate);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <NewIntegrationDialog loading={createIntegration.isPending} onCreate={handleCreate} />
      </div>

      <EditIntegrationDialog
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        integration={editingIntegration}
        loading={updateIntegration.isPending}
        onUpdate={handleUpdate}
      />

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsList 
            integrations={integrations}
            syncing={syncIntegration.isPending ? (syncIntegration.variables as Integration)?.id : null}
            onEdit={handleEditClick}
            onSync={(integration) => syncIntegration.mutate(integration)}
            onDelete={(id) => deleteIntegration.mutate(id)}
          />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <SyncLogsList syncLogs={syncLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
