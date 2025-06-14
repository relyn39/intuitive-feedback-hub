
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) throw new Error('A chave da API da OpenAI não está configurada.');
    
    const { user_id } = await req.json();
    if (!user_id) throw new Error('O user_id é obrigatório.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch analyzed feedbacks for the user
    const { data: feedbacks, error: feedbackError } = await supabaseAdmin
      .from('feedbacks')
      .select('title, description, analysis')
      .eq('user_id', user_id)
      .not('analysis', 'is', null)
      .limit(100);

    if (feedbackError) throw feedbackError;

    if (!feedbacks || feedbacks.length < 3) {
      return new Response(JSON.stringify({ topics: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. Fetch user's AI configuration to get the model
    const { data: aiConfig, error: configError } = await supabaseAdmin
        .from('ai_configurations')
        .select('model')
        .eq('user_id', user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");

    // 3. Format data for the prompt
    const feedbackDataString = feedbacks.map(fb => {
      return `Título: ${fb.title}\nAnálise: ${JSON.stringify(fb.analysis)}`;
    }).join('\n\n---\n\n');

    // 4. Create the prompt for OpenAI
    const prompt = `
      Você é um especialista em análise de dados de feedback. Com base no conjunto de feedbacks fornecido, identifique os 5 tópicos mais discutidos.
      Para cada tópico:
      1.  Dê um nome conciso para o tópico.
      2.  Conte o número de feedbacks que mencionam este tópico (count).
      3.  Determine o sentimento geral do tópico ('positive', 'negative', 'neutral').
      4.  Liste 4 palavras-chave representativas.

      Retorne o resultado como um objeto JSON válido com uma única chave "topics", que é um array de objetos.
      Cada objeto no array deve ter as seguintes chaves: "name", "count", "sentiment", "keywords".

      Exemplo de formato de saída:
      {
        "topics": [
          {
            "name": "Performance & Velocidade",
            "count": 15,
            "sentiment": "negative",
            "keywords": ["lento", "carregamento", "performance", "travando"]
          }
        ]
      }

      --- DADOS DE FEEDBACK ---
      ${feedbackDataString}
      --- FIM DOS DADOS ---
    `;

    // 5. Call OpenAI API
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente analista de dados de feedback. Responda sempre com um JSON válido.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      throw new Error(`Falha na API da OpenAI: ${aiResponse.status} ${errorBody}`);
    }

    const data = await aiResponse.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    // Add id and a placeholder for change
    const topicsWithId = analysis.topics.map((topic: any, index: number) => ({
      ...topic,
      id: index + 1,
      change: 0 // Placeholder, as calculating change is complex
    }));


    return new Response(JSON.stringify({ topics: topicsWithId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função analyze-topics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
