
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NotionConfig } from '../types';

interface NotionConfigFormProps {
  config: NotionConfig;
  onConfigChange: (newConfig: NotionConfig) => void;
}

export const NotionConfigForm: React.FC<NotionConfigFormProps> = ({ config, onConfigChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, [e.target.id]: e.target.value });
  };

  return (
    <div className="space-y-4">
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
        <Label htmlFor="databaseId">Database ID</Label>
        <Input
          id="databaseId"
          value={config.databaseId || ''}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
