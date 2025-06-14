
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ZohoConfig } from '../types';

interface ZohoConfigFormProps {
  config: ZohoConfig;
  onConfigChange: (newConfig: ZohoConfig) => void;
}

export const ZohoConfigForm: React.FC<ZohoConfigFormProps> = ({ config, onConfigChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, [e.target.id]: e.target.value });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          type="password"
          value={config.accessToken || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="orgId">Organization ID</Label>
        <Input
          id="orgId"
          value={config.orgId || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="departmentId">Department ID</Label>
        <Input
          id="departmentId"
          value={config.departmentId || ''}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
