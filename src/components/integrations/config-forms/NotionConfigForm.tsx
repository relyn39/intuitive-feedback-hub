
import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NotionConfig } from '../types';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotionProperty {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

interface NotionProperties {
  [key: string]: NotionProperty;
}

interface NotionConfigFormProps {
  config: NotionConfig;
  onConfigChange: (newConfig: NotionConfig) => void;
}

export const NotionConfigForm: React.FC<NotionConfigFormProps> = ({ config, onConfigChange }) => {
  const [properties, setProperties] = useState<NotionProperties | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, [e.target.id]: e.target.value });
  };
  
  const handleSelectChange = (field: 'titleProperty' | 'descriptionProperty') => (value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  const fetchProperties = async () => {
    if (!config.apiToken || !config.databaseId) {
      setError('API Token e Database ID são obrigatórios.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setProperties(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('notion-get-db-properties', {
        body: { apiToken: config.apiToken, databaseId: config.databaseId },
      });

      if (functionError) throw functionError;
      
      setProperties(data);

    } catch (e: any) {
      console.error(e);
      setError(`Falha ao buscar propriedades: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const { titleProperties, descriptionProperties } = useMemo(() => {
    if (!properties) return { titleProperties: [], descriptionProperties: [] };

    const propsArray = Object.values(properties);

    return {
      titleProperties: propsArray.filter(p => p.type === 'title'),
      descriptionProperties: propsArray.filter(p => p.type === 'rich_text'),
    };
  }, [properties]);

  useEffect(() => {
    if (titleProperties.length === 1 && !config.titleProperty) {
      onConfigChange({ ...config, titleProperty: titleProperties[0].name });
    }
  }, [titleProperties, config, onConfigChange]);

  useEffect(() => {
    if (descriptionProperties.length === 1 && !config.descriptionProperty) {
      onConfigChange({ ...config, descriptionProperty: descriptionProperties[0].name });
    }
  }, [descriptionProperties, config, onConfigChange]);


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
      
      <Button onClick={fetchProperties} disabled={isLoading || !config.apiToken || !config.databaseId} className="w-full">
        {isLoading ? 'Buscando...' : 'Buscar Propriedades da Base de Dados'}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
      
      {properties && (
        <div className="space-y-4 pt-4 border-t">
          <p className="text-sm font-medium">Mapeamento de Campos</p>
          <p className="text-sm text-muted-foreground">
            Selecione quais propriedades devem ser usadas como Título e Descrição.
          </p>
          <div>
            <Label htmlFor="titleProperty">Propriedade do Título</Label>
            <Select
              value={config.titleProperty}
              onValueChange={handleSelectChange('titleProperty')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a propriedade para o título" />
              </SelectTrigger>
              <SelectContent>
                {titleProperties.map(prop => (
                  <SelectItem key={prop.id} value={prop.name}>{prop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {titleProperties.length === 0 && <p className="text-xs text-muted-foreground mt-1">Nenhuma propriedade do tipo 'Title' encontrada.</p>}
          </div>
          <div>
            <Label htmlFor="descriptionProperty">Propriedade da Descrição</Label>
            <Select
              value={config.descriptionProperty}
              onValueChange={handleSelectChange('descriptionProperty')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a propriedade para a descrição" />
              </SelectTrigger>
              <SelectContent>
                {descriptionProperties.map(prop => (
                  <SelectItem key={prop.id} value={prop.name}>{prop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             {descriptionProperties.length === 0 && <p className="text-xs text-muted-foreground mt-1">Nenhuma propriedade do tipo 'Rich Text' encontrada.</p>}
          </div>
        </div>
      )}
    </div>
  );
};
