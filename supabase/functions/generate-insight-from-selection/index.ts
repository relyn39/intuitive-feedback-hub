import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, feedback_ids } = await req.json();
    if (!user_id) throw new Error('O user_id é obrigatório.');
    if (!feedback_ids || !Array.isArray(feedback_ids) || feedback_ids.length === 0) {
      throw new Error('feedback_ids é obrigatório e deve ser um array não vazio.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch selected feedbacks
    const { data: feedbacks, error: feedbackError } = await supabaseAdmin
      .from('feedbacks')
      .select('title, description, analysis')
      .in('id', feedback_ids)
      .eq('user_id', user_id);

    if (feedbackError) throw feedbackError;

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum feedback encontrado para os IDs fornecidos." }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch user's AI configuration
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
      const analysisString = fb.analysis ? `\nAnálise existente: ${JSON.stringify(fb.analysis)}` : '';
      return `Título: ${fb.title}\nDescrição: ${fb.description}${analysisString}`;
    }).join('\n\n---\n\n');

    // 4. Create the prompt for the AI
    const prompt = `
      Você é um assistente especialista em análise de dados de feedback de produto. Com base no conjunto de feedbacks fornecido, sintetize-os em um único insight acionável.
      Identifique se o insight consolidado é uma 'trend' (tendência), 'alert' (alerta) ou 'opportunity' (oportunidade).
      Forneça um título conciso, uma descrição que resuma os pontos principais, uma severidade ('info', 'warning', 'success') e uma ação sugerida.
      Retorne o resultado como um objeto JSON válido, contendo as seguintes chaves: "type", "title", "description", "severity", "action".

      Exemplo de formato de saída:
      {
        "type": "opportunity",
        "title": "Melhoria na exportação de dados",
        "description": "Múltiplos usuários relatam dificuldades e pedem mais formatos ao exportar relatórios.",
        "severity": "warning",
        "action": "Priorizar a reformulação do recurso de exportação."
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

    const insightData = JSON.parse(aiResponseText);

    if (!insightData || typeof insightData !== 'object' || Array.isArray(insightData)) {
        throw new Error('A resposta da IA não continha um objeto de insight válido.');
    }

    // Return the generated insight data without saving it
    return new Response(JSON.stringify({ insight: insightData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função generate-insight-from-selection:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
