
import React from 'react';
import { IntegrationsManager } from '@/components/IntegrationsManager';

const SettingsIntegrations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrações</h2>
        <p className="text-muted-foreground">
          Configure e gerencie suas conexões com sistemas externos
        </p>
      </div>
      
      <IntegrationsManager />
    </div>
  );
};

export default SettingsIntegrations;
