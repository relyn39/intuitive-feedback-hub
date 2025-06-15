import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const aiConfigSchema = z.object({
  provider: z.enum(['openai', 'google', 'claude', 'deepseek']),
  model: z.string().min(1, 'O modelo é obrigatório.'),
  api_key: z.string().optional(),
});

type AiConfigFormValues = z.infer<typeof aiConfigSchema>;

// Mock function to get user ID, replace with your actual auth logic
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user.id;
};

const modelOptions = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Mais poderoso)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e econômico)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  google: [
    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Mais poderoso)' },
    { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Rápido e econômico)' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
  ],
  claude: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Mais poderoso)' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Equilibrado)' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Rápido e econômico)' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat (Modelo de Chat)' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder (Modelo de Código)' },
  ],
};

const providerDescriptions = {
  openai: 'O modelo da OpenAI que será usado para a análise.',
  google: 'O modelo do Google que será usado para a análise.',
  claude: 'O modelo da Anthropic (Claude) que será usado para a análise.',
  deepseek: 'O modelo da Deepseek que será usado para a análise.',
};

export const AiManager = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['aiConfig'],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AiConfigFormValues) => {
        const userId = await getUserId();
        
        const dataToUpsert: {
            user_id: string;
            provider: 'openai' | 'google' | 'claude' | 'deepseek';
            model: string;
            updated_at: string;
            api_key?: string;
        } = { 
            user_id: userId,
            provider: values.provider,
            model: values.model,
            updated_at: new Date().toISOString()
        };

        if (values.api_key && values.api_key.trim() !== '') {
            dataToUpsert.api_key = values.api_key;
        }

        const { data, error } = await supabase
            .from('ai_configurations')
            .upsert(dataToUpsert, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },
    onSuccess: () => {
      toast.success('Configuração de IA salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['aiConfig'] });
      form.reset({ ...form.getValues(), api_key: '' });
    },
    onError: (error) => {
      toast.error('Erro ao salvar configuração: ' + error.message);
    }
  });

  const form = useForm<AiConfigFormValues>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      api_key: '',
    },
  });

  useEffect(() => {
    if (config) {
      let defaultModel = '';
      const provider = config.provider as keyof typeof modelOptions;
      if (modelOptions[provider]) {
        defaultModel = modelOptions[provider][0].value;
      }

      form.reset({
        provider: provider,
        model: config.model || defaultModel,
        api_key: '', // Sempre manter o campo da chave em branco ao carregar
      });
    }
  }, [config, form]);

  const watchedProvider = form.watch('provider');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Provedor de IA</CardTitle>
        <CardDescription>
          Selecione o provedor, o modelo e forneça sua chave de API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Conecte seu provedor de IA</AlertTitle>
          <AlertDescription>
            Para usar a análise de IA, adicione sua chave de API do provedor (OpenAI ou Google) abaixo.
            Sua chave é armazenada de forma segura e usada apenas para as análises da sua conta. 
            Deixar o campo em branco manterá a chave existente.
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provedor</FormLabel>
                  <Select
                    onValueChange={(value: 'openai' | 'google' | 'claude' | 'deepseek') => {
                      field.onChange(value);
                      // Set default model for the selected provider
                      if (value === 'openai') {
                        form.setValue('model', 'gpt-4o-mini', { shouldValidate: true });
                      } else if (value === 'google') {
                        form.setValue('model', 'gemini-1.5-flash-latest', { shouldValidate: true });
                      } else if (value === 'claude') {
                        form.setValue('model', 'claude-3-haiku-20240307', { shouldValidate: true });
                      } else if (value === 'deepseek') {
                        form.setValue('model', 'deepseek-chat', { shouldValidate: true });
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um provedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                      <SelectItem value="deepseek">Deepseek</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    O provedor que será usado para a análise de IA.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(modelOptions[watchedProvider] || []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {providerDescriptions[watchedProvider]}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave de API (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••••••••••••••" {...field} autoComplete="new-password" />
                  </FormControl>
                  <FormDescription>
                    Preencha apenas se desejar atualizar sua chave de API.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending || isLoading}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
