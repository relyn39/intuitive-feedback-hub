
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Pencil } from 'lucide-react';
import { EditUserDialog } from '@/components/EditUserDialog';
import { AddUserDialog } from '@/components/AddUserDialog';

const fetchUsers = async () => {
  const { data, error } = await supabase.from('profiles').select('id, full_name, email, created_at');
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

const SettingsUsers = () => {
  const { data: users, isLoading, error } = useQuery<UserProfile[]>({ queryKey: ['users'], queryFn: fetchUsers });
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie o acesso e o cadastro de usuários na plataforma.
          </p>
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os usuários com acesso à plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando usuários...</p>}
          {error && <p className="text-destructive">Erro ao carregar usuários: {error.message}</p>}
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !isLoading && <p>Nenhum usuário encontrado.</p>
          )}
        </CardContent>
      </Card>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingUser(null);
            }
          }}
        />
      )}

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
      />
    </div>
  );
};

export default SettingsUsers;
