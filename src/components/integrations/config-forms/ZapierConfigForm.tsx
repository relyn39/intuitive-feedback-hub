
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export const ZapierConfigForm = () => {
  return (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Configuração do Zapier</AlertTitle>
      <AlertDescription>
        Após criar a integração, o URL do webhook para o Zapier será exibido na lista de integrações.
      </AlertDescription>
    </Alert>
  );
};
