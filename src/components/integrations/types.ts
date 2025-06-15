export interface JiraConfig {
  jiraUrl?: string;
  email?: string;
  apiToken?: string;
  jql?: string;
}

export interface NotionConfig {
  apiToken?: string;
  databaseId?: string;
  titleProperty?: string;
  descriptionProperty?: string;
}

export interface ZohoConfig {
  accessToken?: string;
  orgId?: string;
  departmentId?: string;
}

export interface ZapierConfig {}

export type IntegrationConfig = JiraConfig | NotionConfig | ZohoConfig | ZapierConfig;

export type IntegrationSyncFrequency = 'manual' | 'hourly' | 'twice_daily' | 'daily';

export type IntegrationSource = 'jira' | 'notion' | 'zoho' | 'zapier';

export interface Integration {
  id: string;
  source: IntegrationSource;
  name: string;
  config: IntegrationConfig;
  is_active: boolean;
  created_at: string;
  sync_frequency: IntegrationSyncFrequency;
  last_synced_at?: string;
}

export interface SyncLog {
  id: string;
  status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  integrations?: {
      name: string;
      source: string;
  };
}
