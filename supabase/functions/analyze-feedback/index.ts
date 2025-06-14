
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback_id } = await req.json();
    if (!feedback_id) throw new Error('feedback_id é obrigatório.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get feedback details
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedbacks')
      .select('id, title, description, user_id')
      .eq('id', feedback_id)
      .single();

    if (feedbackError) throw feedbackError;
    if (!feedback) throw new Error('Feedback não encontrado.');
    
    // Get user's AI configuration
    const { data: aiConfig, error: configError } = await supabaseAdmin
        .from('ai_configurations')
        .select('provider, model')
        .eq('user_id', feedback.user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");

    if (aiConfig.provider !== 'openai' || !openAIApiKey) {
        throw new Error('Análise com OpenAI não está configurada ou a chave de API não foi fornecida.');
    }

    const prompt = `
      Analise o seguinte feedback de usuário e retorne um objeto JSON com as seguintes chaves: "sentiment" (pode ser "positive", "negative", "neutral"), "summary" (um resumo de uma frase), e "tags" (um array de até 5 palavras-chave relevantes).

      Feedback:
      Título: ${feedback.title}
      Descrição: ${feedback.description}
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente especialista em análise de feedback de produto. Responda sempre em formato JSON válido.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Falha na API da OpenAI: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Save analysis back to the feedback
    const { error: updateError } = await supabaseAdmin
        .from('feedbacks')
        .update({ analysis })
        .eq('id', feedback.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função analyze-feedback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
