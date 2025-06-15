import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(JSON.stringify({ insights: [], message: "Dados de feedback analisados insuficientes para gerar insights." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch user's AI configuration to get the model and key
    const { data: aiConfig, error: configError } = await supabaseAdmin
        .from('ai_configurations')
        .select('model, provider, api_key')
        .eq('user_id', user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");

    const { provider, model, api_key: userApiKey } = aiConfig;
    const apiKey = userApiKey || Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKey) throw new Error(`A chave da API para ${provider} não está configurada.`);

    // 3. Format data for the prompt
    const feedbackDataString = feedbacks.map(fb => {
      return `Título: ${fb.title}\nDescrição: ${fb.description}\nAnálise: ${JSON.stringify(fb.analysis)}`;
    }).join('\n\n---\n\n');

    // 4. Create the prompt for the AI
    const prompt = `
      Você é um assistente especialista em análise de dados de feedback de produto. Com base no conjunto de dados de feedback fornecido, gere de 3 a 5 insights importantes.
      Para cada insight, identifique se é uma 'trend' (tendência), 'alert' (alerta), 'opportunity' (oportunidade) ou 'other' (outro).
      Forneça um título conciso, uma descrição de uma frase, a severidade ('info', 'warning', 'success', 'error') e uma ação sugerida.
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
          },
          {
            "type": "alert",
            "title": "Aumento de erros após a última atualização",
            "description": "Vários usuários relatam que o aplicativo está travando na tela de login desde a versão 2.5.",
            "severity": "error",
            "action": "Investigar os logs de erro e reverter a atualização de login, se necessário."
          }
        ]
      }

      --- DADOS DE FEEDBACK ---
      ${feedbackDataString}
      --- FIM DOS DADOS ---
    `;
    
    let aiResponseText = '';

    if (provider === 'openai' || provider === 'deepseek') {
        const apiUrl = provider === 'openai' 
            ? 'https://api.openai.com/v1/chat/completions' 
            : 'https://api.deepseek.com/v1/chat/completions';
        
        const aiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'system', content: 'Você é um assistente analista de dados de feedback. Responda sempre com um JSON válido.' }, { role: 'user', content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.5,
            }),
        });
        if (!aiResponse.ok) throw new Error(`Falha na API da ${provider}: ${await aiResponse.text()}`);
        const data = await aiResponse.json();
        aiResponseText = data.choices[0].message.content;

    } else if (provider === 'google') {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const aiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        if (!aiResponse.ok) throw new Error(`Falha na API da Google: ${await aiResponse.text()}`);
        const data = await aiResponse.json();
        const cleanedText = data.candidates[0].content.parts[0].text.replace(/```json\n?|\n?```/g, '');
        aiResponseText = cleanedText;

    } else if (provider === 'claude') {
        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }],
                system: 'Você é um assistente analista de dados de feedback. Responda sempre com um JSON válido.',
            }),
        });
        if (!aiResponse.ok) throw new Error(`Falha na API da Anthropic: ${await aiResponse.text()}`);
        const data = await aiResponse.json();
        aiResponseText = data.content[0].text;
    } else {
        throw new Error(`O provedor de IA '${provider}' não é suportado.`);
    }

    const analysis = JSON.parse(aiResponseText);
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
    
    return new Response(JSON.stringify({ insights: insightsWithUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função generate-insights:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
