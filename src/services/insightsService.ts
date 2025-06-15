
import { supabase } from '@/integrations/supabase/client';
import { Insight } from '@/types/insights';

export const fetchInsights = async (): Promise<Insight[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const generateInsights = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { user_id: user.id }
    });

    if (error) {
        throw new Error(`Falha ao gerar insights: ${error.message}`);
    }
    
    if (data?.message) {
      console.log(data.message)
    }

    return data;
};
