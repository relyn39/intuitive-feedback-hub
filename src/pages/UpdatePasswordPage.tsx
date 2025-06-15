
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const updatePasswordSchema = z.object({
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

const UpdatePasswordPage = () => {
  const navigate = useNavigate();

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sua senha foi atualizada com sucesso!');
      await supabase.auth.signOut();
      navigate('/auth');
    }
  };

  return (
    <div className="flex justify-center items-center h-full p-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Atualizar Senha</CardTitle>
          <CardDescription>Insira sua nova senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;
