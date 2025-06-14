
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // O JWT do usuário é verificado automaticamente pelo Supabase.
    // Estamos pegando o corpo da requisição.
    const { query, user_id } = await req.json();
    if (!query) throw new Error('A consulta (query) é obrigatória.');
    if (!user_id) throw new Error('O user_id é obrigatório.');
    if (!openAIApiKey) throw new Error('A chave da API da OpenAI não está configurada.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca todos os feedbacks analisados para o usuário
    const { data: feedbacks, error: feedbackError } = await supabaseAdmin
      .from('feedbacks')
      .select('title, description, analysis')
      .eq('user_id', user_id)
      .not('analysis', 'is', null) // Apenas feedbacks que foram analisados
      .limit(100); // Limita para evitar prompts excessivamente grandes

    if (feedbackError) throw feedbackError;

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(JSON.stringify({ response: "Não há dados de feedback analisados suficientes para responder a esta pergunta. Por favor, analise alguns feedbacks primeiro." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Busca a configuração de IA do usuário para obter o modelo
    const { data: aiConfig, error: configError } = await supabaseAdmin
        .from('ai_configurations')
        .select('model')
        .eq('user_id', user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");

    // 3. Formata os dados para o prompt
    const feedbackDataString = feedbacks.map(fb => {
      return `Título: ${fb.title}\nDescrição: ${fb.description}\nAnálise da IA: ${JSON.stringify(fb.analysis)}`;
    }).join('\n\n---\n\n');

    // 4. Cria o prompt para a OpenAI
    const prompt = `
      Você é um assistente especialista em análise de dados de feedback de produto.
      Com base no conjunto de dados de feedback fornecido abaixo, responda à seguinte pergunta do usuário.
      Seja conciso, direto e baseie sua resposta estritamente nos dados fornecidos.
      Se os dados não forem suficientes para responder, informe isso.

      --- DADOS DE FEEDBACK ---
      ${feedbackDataString}
      --- FIM DOS DADOS ---

      --- PERGUNTA DO USUÁRIO ---
      ${query}
      --- FIM DA PERGUNTA ---

      Sua Resposta:
    `;

    // 5. Chama a API da OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente analista de dados de feedback.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      throw new Error(`Falha na API da OpenAI: ${aiResponse.status} ${errorBody}`);
    }

    const data = await aiResponse.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função natural-language-query:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
