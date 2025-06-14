import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, Settings, Plus, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JiraConfig {
  jiraUrl?: string;
  email?: string;
  apiToken?: string;
  jql?: string;
}

interface NotionConfig {
  apiToken?: string;
  databaseId?: string;
}

interface ZohoConfig {
  accessToken?: string;
  orgId?: string;
  departmentId?: string;
}

type IntegrationConfig = JiraConfig | NotionConfig | ZohoConfig;

interface Integration {
  id: string;
  source: 'jira' | 'notion' | 'zoho';
  name: string;
  config: IntegrationConfig;
  is_active: boolean;
  created_at: string;
}

interface SyncLog {
  id: string;
  status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export const IntegrationsManager = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  const [newIntegration, setNewIntegration] = useState({
    source: '' as 'jira' | 'notion' | 'zoho',
    name: '',
    config: {} as IntegrationConfig
  });

  useEffect(() => {
    fetchIntegrations();
    fetchSyncLogs();
  }, []);

  const fetchIntegrations = async () => {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar integrações",
        variant: "destructive"
      });
      return;
    }

    setIntegrations(data || []);
  };

  const fetchSyncLogs = async () => {
    const { data, error } = await supabase
      .from('sync_logs')
      .select(`
        *,
        integrations(name, source)
      `)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching sync logs:', error);
      return;
    }

    setSyncLogs(data || []);
  };

  const createIntegration = async () => {
    if (!newIntegration.source || !newIntegration.name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('integrations')
      .insert({
        source: newIntegration.source,
        name: newIntegration.name,
        config: newIntegration.config
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar integração",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Integração criada com sucesso"
      });
      setNewIntegration({ source: '' as any, name: '', config: {} });
      fetchIntegrations();
    }
    setLoading(false);
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao deletar integração",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Integração deletada com sucesso"
      });
      fetchIntegrations();
    }
  };

  const syncIntegration = async (integration: Integration) => {
    setSyncing(integration.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const functionName = `${integration.source}-sync`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { integrationId: integration.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Sincronização concluída: ${data.created} criados, ${data.updated} atualizados`,
      });
      
      fetchSyncLogs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha na sincronização: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const renderConfigForm = () => {
    switch (newIntegration.source) {
      case 'jira':
        const jiraConfig = newIntegration.config as JiraConfig;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="jiraUrl">URL do Jira</Label>
              <Input
                id="jiraUrl"
                placeholder="https://yourcompany.atlassian.net"
                value={jiraConfig.jiraUrl || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, jiraUrl: e.target.value } as JiraConfig
                }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={jiraConfig.email || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, email: e.target.value } as JiraConfig
                }))}
              />
            </div>
            <div>
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                value={jiraConfig.apiToken || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, apiToken: e.target.value } as JiraConfig
                }))}
              />
            </div>
            <div>
              <Label htmlFor="jql">JQL Query (opcional)</Label>
              <Input
                id="jql"
                placeholder="project = PROJ ORDER BY updated DESC"
                value={jiraConfig.jql || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, jql: e.target.value } as JiraConfig
                }))}
              />
            </div>
          </div>
        );
      
      case 'notion':
        const notionConfig = newIntegration.config as NotionConfig;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                value={notionConfig.apiToken || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, apiToken: e.target.value } as NotionConfig
                }))}
              />
            </div>
            <div>
              <Label htmlFor="databaseId">Database ID</Label>
              <Input
                id="databaseId"
                value={notionConfig.databaseId || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, databaseId: e.target.value } as NotionConfig
                }))}
              />
            </div>
          </div>
        );
      
      case 'zoho':
        const zohoConfig = newIntegration.config as ZohoConfig;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                value={zohoConfig.accessToken || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, accessToken: e.target.value } as ZohoConfig
                }))}
              />
            </div>
            <div>
              <Label htmlFor="orgId">Organization ID</Label>
              <Input
                id="orgId"
                value={zohoConfig.orgId || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, orgId: e.target.value } as ZohoConfig
                }))}
              />
            </div>
            <div>
              <Label htmlFor="departmentId">Department ID</Label>
              <Input
                id="departmentId"
                value={zohoConfig.departmentId || ''}
                onChange={(e) => setNewIntegration(prev => ({
                  ...prev,
                  config: { ...prev.config, departmentId: e.target.value } as ZohoConfig
                }))}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Integração</DialogTitle>
              <DialogDescription>
                Configure uma nova integração com seus sistemas externos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="source">Plataforma</Label>
                <Select onValueChange={(value: any) => setNewIntegration(prev => ({ ...prev, source: value, config: {} }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="notion">Notion</SelectItem>
                    <SelectItem value="zoho">Zoho</SelectItem>
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
              <Button onClick={createIntegration} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Integração'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="capitalize">
                        {integration.source}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={integration.is_active ? "default" : "secondary"}>
                      {integration.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncIntegration(integration)}
                      disabled={syncing === integration.id}
                    >
                      {syncing === integration.id ? (
                        <Activity className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteIntegration(integration.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Criado em {new Date(integration.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4">
            {syncLogs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {(log as any).integrations?.name} - {(log as any).integrations?.source}
                    </CardTitle>
                    <Badge variant={
                      log.status === 'success' ? 'default' : 
                      log.status === 'error' ? 'destructive' : 'secondary'
                    }>
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
                  {log.error_message && (
                    <p className="text-sm text-destructive mt-2">{log.error_message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(log.started_at).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
