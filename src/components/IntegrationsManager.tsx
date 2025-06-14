
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Integration } from './integrations/types';
import { NewIntegrationDialog } from './integrations/NewIntegrationDialog';
import { EditIntegrationDialog } from './integrations/EditIntegrationDialog';
import { IntegrationsList } from './integrations/IntegrationsList';
import { SyncLogsList } from './integrations/SyncLogsList';

export const IntegrationsManager = () => {
  const { 
    integrations, 
    syncLogs, 
    loading, 
    syncing, 
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <NewIntegrationDialog loading={loading} onCreate={createIntegration} />
      </div>

      <EditIntegrationDialog
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        integration={editingIntegration}
        loading={loading}
        onUpdate={updateIntegration}
      />

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsList 
            integrations={integrations}
            syncing={syncing}
            onEdit={handleEditClick}
            onSync={syncIntegration}
            onDelete={deleteIntegration}
          />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <SyncLogsList syncLogs={syncLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
