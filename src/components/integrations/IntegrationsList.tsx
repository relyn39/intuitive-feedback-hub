
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, Activity, Pencil } from 'lucide-react';
import { Integration } from './types';

interface IntegrationsListProps {
  integrations: Integration[];
  syncing: string | null;
  onEdit: (integration: Integration) => void;
  onSync: (integration: Integration) => void;
  onDelete: (id: string) => void;
}

export const IntegrationsList: React.FC<IntegrationsListProps> = ({ integrations, syncing, onEdit, onSync, onDelete }) => {
  return (
    <div className="grid gap-4">
      {integrations.map((integration) => (
        <Card key={integration.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="capitalize">{integration.source}</Badge>
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={integration.is_active ? "default" : "secondary"}>
                {integration.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <Button variant="outline" size="icon" onClick={() => onEdit(integration)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onSync(integration)} disabled={syncing === integration.id}>
                {syncing === integration.id ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" size="icon" onClick={() => onDelete(integration.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Frequência de Sincronização: <span className="font-medium capitalize">{integration.sync_frequency.replace('_', ' ')}</span></p>
              <p>Última Sincronização: <span className="font-medium">{integration.last_synced_at ? new Date(integration.last_synced_at).toLocaleString('pt-BR') : 'Nunca'}</span></p>
              <p>Criado em {new Date(integration.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
