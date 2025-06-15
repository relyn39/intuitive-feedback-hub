
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Integration, IntegrationSyncFrequency, IntegrationConfig, JiraConfig, NotionConfig, ZohoConfig } from './types';
import { JiraConfigForm } from './config-forms/JiraConfigForm';
import { NotionConfigForm } from './config-forms/NotionConfigForm';
import { ZohoConfigForm } from './config-forms/ZohoConfigForm';
import { ZapierConfigForm } from './config-forms/ZapierConfigForm';

interface EditIntegrationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
  loading: boolean;
  onUpdate: (integration: Integration) => Promise<boolean>;
}

export const EditIntegrationDialog: React.FC<EditIntegrationDialogProps> = ({ isOpen, onOpenChange, integration, loading, onUpdate }) => {
  const [editableIntegration, setEditableIntegration] = useState<Integration | null>(integration);

  useEffect(() => {
    setEditableIntegration(integration);
  }, [integration]);

  const handleUpdate = async () => {
    if (!editableIntegration) return;
    const success = await onUpdate(editableIntegration);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleConfigChange = (newConfig: IntegrationConfig) => {
    setEditableIntegration(prev => prev ? { ...prev, config: newConfig } : null);
  };

  const renderConfigForm = () => {
    if (!editableIntegration) return null;

    switch (editableIntegration.source) {
      case 'jira':
        return <JiraConfigForm config={editableIntegration.config as JiraConfig} onConfigChange={handleConfigChange} />;
      case 'notion':
        return <NotionConfigForm config={editableIntegration.config as NotionConfig} onConfigChange={handleConfigChange} />;
      case 'zoho':
        return <ZohoConfigForm config={editableIntegration.config as ZohoConfig} onConfigChange={handleConfigChange} />;
      case 'zapier':
        return <ZapierConfigForm />;
      default:
        return <p className="text-sm text-muted-foreground">Esta integração não possui configurações editáveis.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Integração</DialogTitle>
          <DialogDescription>Atualize os detalhes e a configuração da sua integração.</DialogDescription>
        </DialogHeader>
        {editableIntegration && (
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div>
              <Label htmlFor="edit-name">Nome da Integração</Label>
              <Input
                id="edit-name"
                value={editableIntegration.name}
                onChange={(e) => setEditableIntegration(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Ex: Jira - Projeto Principal"
              />
            </div>
            {editableIntegration.source !== 'zapier' && (
              <div>
                <Label htmlFor="edit-sync-frequency">Frequência de Sincronização</Label>
                <Select
                  value={editableIntegration.sync_frequency}
                  onValueChange={(value: IntegrationSyncFrequency) => setEditableIntegration(prev => prev ? { ...prev, sync_frequency: value } : null)}
                >
                  <SelectTrigger id="edit-sync-frequency">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="hourly">De hora em hora</SelectItem>
                    <SelectItem value="twice_daily">Duas vezes ao dia</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="pt-4 border-t">
              <h4 className="text-md font-medium mb-4">Configuração da Fonte</h4>
               {renderConfigForm()}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
