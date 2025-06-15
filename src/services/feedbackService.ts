
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export const getRecentFeedbacks = async (): Promise<Tables<'feedbacks'>[]> => {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return data || [];
};

export const analyzeFeedback = async (feedbackId: string) => {
    const { error } = await supabase.functions.invoke('analyze-feedback', {
        body: { feedback_id: feedbackId },
    });
    if (error) throw new Error(error.message);
};
