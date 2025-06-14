
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
      return new Response(JSON.stringify({ message: "Dados de feedback analisados insuficientes para gerar insights." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
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
      return `Título: ${fb.title}\nDescrição: ${fb.description}\nAnálise: ${JSON.stringify(fb.analysis)}`;
    }).join('\n\n---\n\n');

    // 4. Create the prompt for OpenAI
    const prompt = `
      Você é um assistente especialista em análise de dados de feedback de produto. Com base no conjunto de dados de feedback fornecido, gere de 3 a 5 insights importantes.
      Para cada insight, identifique se é uma 'trend' (tendência), 'alert' (alerta) ou 'opportunity' (oportunidade).
      Forneça um título conciso, uma descrição de uma frase, a severidade ('info', 'warning', 'success') e uma ação sugerida.
      Retorne o resultado como um objeto JSON válido com uma única chave "insights", que é um array de objetos.
      Cada objeto no array deve ter as seguintes chaves: "type", "title", "description", "severity", "action".

      Exemplo de formato de saída:
      {
        "insights": [
          {
            "type": "trend",
            "title": "Tendência emergente no feedback da UI",
            "description": "Um número significativo de usuários está mencionando o desejo por um recurso de modo escuro.",
            "severity": "info",
            "action": "Considerar priorizar o desenvolvimento do modo escuro"
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
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      throw new Error(`Falha na API da OpenAI: ${aiResponse.status} ${errorBody}`);
    }

    const data = await aiResponse.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    const insightsToInsert = analysis.insights;

    if (!insightsToInsert || !Array.isArray(insightsToInsert)) {
        throw new Error('A resposta da IA não continha um array de insights válido.');
    }

    // 7. Save insights to DB
    // First, delete old insights for the user
    const { error: deleteError } = await supabaseAdmin.from('insights').delete().eq('user_id', user_id);
    if (deleteError) throw deleteError;

    // Then, insert new ones
    const insightsWithUserId = insightsToInsert.map((insight: any) => ({ ...insight, user_id }));
    const { error: insertError } = await supabaseAdmin.from('insights').insert(insightsWithUserId);
    if (insertError) throw insertError;
    
    return new Response(JSON.stringify({ message: "Insights gerados e salvos com sucesso!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função generate-insights:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

