
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { JiraConfig } from '../types';

interface JiraConfigFormProps {
  config: JiraConfig;
  onConfigChange: (newConfig: JiraConfig) => void;
}

export const JiraConfigForm: React.FC<JiraConfigFormProps> = ({ config, onConfigChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, [e.target.id]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="jiraUrl">URL do Jira</Label>
        <Input
          id="jiraUrl"
          placeholder="https://yourcompany.atlassian.net"
          value={config.jiraUrl || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={config.email || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="apiToken">API Token</Label>
        <Input
          id="apiToken"
          type="password"
          value={config.apiToken || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="jql">JQL Query (opcional)</Label>
        <Input
          id="jql"
          placeholder="project = PROJ ORDER BY updated DESC"
          value={config.jql || ''}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
