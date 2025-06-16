
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDemoMode } from '@/hooks/useDemoMode';
import { AlertCircle } from 'lucide-react';

export const DemoModeSettings = () => {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Modo Demonstração
        </CardTitle>
        <CardDescription>
          Ative o modo demonstração para exibir dados de teste e demonstrar as funcionalidades do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="demo-mode">Ativar modo demonstração</Label>
            <p className="text-sm text-muted-foreground">
              Quando ativado, o sistema exibirá dados fictícios para demonstração
            </p>
          </div>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={toggleDemoMode}
          />
        </div>
        
        {isDemoMode && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Modo demonstração ativo:</strong> Os dados exibidos no dashboard são fictícios e servem apenas para demonstração das funcionalidades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
