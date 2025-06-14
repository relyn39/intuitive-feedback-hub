
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { IntegrationSource, IntegrationConfig, JiraConfig, NotionConfig, ZohoConfig } from './types';
import { JiraConfigForm } from './config-forms/JiraConfigForm';
import { NotionConfigForm } from './config-forms/NotionConfigForm';
import { ZohoConfigForm } from './config-forms/ZohoConfigForm';
import { ZapierConfigForm } from './config-forms/ZapierConfigForm';

interface NewIntegrationDialogProps {
  loading: boolean;
  onCreate: (integration: { source: IntegrationSource; name: string; config: IntegrationConfig }) => Promise<boolean>;
}

export const NewIntegrationDialog: React.FC<NewIntegrationDialogProps> = ({ loading, onCreate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    source: '' as IntegrationSource,
    name: '',
    config: {} as IntegrationConfig,
  });

  const handleCreate = async () => {
    const success = await onCreate(newIntegration);
    if (success) {
      setNewIntegration({ source: '' as IntegrationSource, name: '', config: {} });
      setIsOpen(false);
    }
  };
  
  const renderConfigForm = () => {
    switch (newIntegration.source) {
      case 'jira':
        return <JiraConfigForm config={newIntegration.config as JiraConfig} onConfigChange={(config) => setNewIntegration(prev => ({ ...prev, config }))} />;
      case 'notion':
        return <NotionConfigForm config={newIntegration.config as NotionConfig} onConfigChange={(config) => setNewIntegration(prev => ({ ...prev, config }))} />;
      case 'zoho':
        return <ZohoConfigForm config={newIntegration.config as ZohoConfig} onConfigChange={(config) => setNewIntegration(prev => ({ ...prev, config }))} />;
      case 'zapier':
        return <ZapierConfigForm />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Integração
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Integração</DialogTitle>
          <DialogDescription>Configure uma nova integração com seus sistemas externos</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="source">Plataforma</Label>
            <Select onValueChange={(value: IntegrationSource) => setNewIntegration({ source: value, name: '', config: {} })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jira">Jira</SelectItem>
                <SelectItem value="notion">Notion</SelectItem>
                <SelectItem value="zoho">Zoho</SelectItem>
                <SelectItem value="zapier">Zapier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="name">Nome da Integração</Label>
            <Input
              id="name"
              value={newIntegration.name}
              onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Jira - Projeto Principal"
            />
          </div>
          {renderConfigForm()}
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Integração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
