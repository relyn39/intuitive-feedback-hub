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
  customer_name: z.string().optional(),
  interviewee_name: z.string().optional(),
  conversation_at: z.string().optional(),
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
      customer_name: '',
      interviewee_name: '',
      conversation_at: '',
    },
  });

  const onSubmit = async (values: AddManualFeedbackFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const feedbackData = {
        ...values,
        description: values.description || null,
        customer_name: values.customer_name || null,
        interviewee_name: values.interviewee_name || null,
        conversation_at: values.conversation_at ? new Date(values.conversation_at).toISOString() : null,
        user_id: user.id,
        source: 'manual',
        status: 'new',
      };

      const { error } = await supabase.from('feedbacks').insert(feedbackData);

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
        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Empresa Acme" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interviewee_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Entrevistado (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="conversation_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e Hora da Conversa (opcional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value || ''} />
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
