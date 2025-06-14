
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, { message: 'O título é obrigatório.' }),
  description: z.string().optional(),
});

type AddManualFeedbackFormValues = z.infer<typeof formSchema>;

export const AddManualFeedback = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<AddManualFeedbackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (values: AddManualFeedbackFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase.from('feedbacks').insert({
        ...values,
        user_id: user.id,
        source: 'manual',
        status: 'new',
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Feedback adicionado manualmente.',
      });
      await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      await queryClient.invalidateQueries();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar feedback',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Resumo do feedback" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea className="min-h-[100px]" placeholder="Detalhes do feedback (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Feedback'
          )}
        </Button>
      </form>
    </Form>
  );
};
