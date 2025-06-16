
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { DemoModeSettings } from '@/components/DemoModeSettings';

const Settings = () => {
  const location = useLocation()
  
  // Se estamos na rota exata /settings, mostrar uma página de overview
  const isSettingsRoot = location.pathname === '/settings'

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Configurações</h1>
      </header>
      
      <div className="flex-1 p-6">
        {isSettingsRoot ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
              <p className="text-muted-foreground">
                Gerencie as configurações da sua plataforma de feedback
              </p>
            </div>
            
            <DemoModeSettings />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-2">Integrações</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure conexões com Jira, Notion, Zoho e outras plataformas
                </p>
                <a 
                  href="/settings/integrations" 
                  className="text-primary hover:underline"
                >
                  Gerenciar integrações →
                </a>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-2">Inteligência Artificial</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure um provedor de LLM para analisar seus feedbacks.
                </p>
                <a 
                  href="/settings/ai" 
                  className="text-primary hover:underline"
                >
                  Configurar IA →
                </a>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-2">Usuários</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie o acesso e o cadastro de usuários na plataforma.
                </p>
                <a 
                  href="/settings/users" 
                  className="text-primary hover:underline"
                >
                  Gerenciar usuários →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default Settings;
