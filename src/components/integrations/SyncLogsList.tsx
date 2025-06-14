
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncLog } from './types';

interface SyncLogsListProps {
  syncLogs: SyncLog[];
}

export const SyncLogsList: React.FC<SyncLogsListProps> = ({ syncLogs }) => {
  return (
    <div className="grid gap-4">
      {syncLogs.map((log) => (
        <Card key={log.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{log.integrations?.name} - {log.integrations?.source}</CardTitle>
              <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                {log.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Processados</p>
                <p className="font-medium">{log.items_processed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criados</p>
                <p className="font-medium">{log.items_created}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizados</p>
                <p className="font-medium">{log.items_updated}</p>
              </div>
            </div>
            {log.error_message && (<p className="text-sm text-destructive mt-2">{log.error_message}</p>)}
            <p className="text-xs text-muted-foreground mt-2">{new Date(log.started_at).toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
