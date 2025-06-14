
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const SettingsUsers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        <p className="text-muted-foreground">
          Gerencie o acesso e o cadastro de usuários na plataforma.
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
                <CardTitle>Autenticação</CardTitle>
                <CardDescription>
                    Acesse a página de autenticação para criar uma nova conta ou fazer login.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <Link to="/auth">
                <Button>Ir para Login / Cadastro</Button>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsUsers;
