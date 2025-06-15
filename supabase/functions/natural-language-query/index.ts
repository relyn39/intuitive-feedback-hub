
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, user_id } = await req.json();
    if (!query) throw new Error('A consulta (query) é obrigatória.');
    if (!user_id) throw new Error('O user_id é obrigatório.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca todos os feedbacks analisados para o usuário
    const { data: feedbacks, error: feedbackError } = await supabaseAdmin
      .from('feedbacks')
      .select('title, description, analysis')
      .eq('user_id', user_id)
      .not('analysis', 'is', null)
      .limit(100);

    if (feedbackError) throw feedbackError;

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(JSON.stringify({ response: "Não há dados de feedback analisados suficientes para responder a esta pergunta. Por favor, analise alguns feedbacks primeiro." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Busca a configuração de IA do usuário
    const { data: aiConfig, error: configError } = await supabaseAdmin
        .from('ai_configurations')
        .select('model, provider, api_key')
        .eq('user_id', user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");
    
    const { provider, model, api_key: userApiKey } = aiConfig;

    const apiKey = userApiKey || Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKey) throw new Error(`A chave da API para ${provider} não está configurada. Por favor, adicione-a nas configurações de IA.`);

    // 3. Formata os dados para o prompt
    const feedbackDataString = feedbacks.map(fb => {
      return `Título: ${fb.title}\nDescrição: ${fb.description}\nAnálise da IA: ${JSON.stringify(fb.analysis)}`;
    }).join('\n\n---\n\n');

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

    // 4. Chama a API do provedor de IA selecionado
    let aiMessage = '';
    
    if (provider === 'openai' || provider === 'deepseek') {
        const apiUrl = provider === 'openai' 
            ? 'https://api.openai.com/v1/chat/completions' 
            : 'https://api.deepseek.com/v1/chat/completions';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'system', content: 'Você é um assistente analista de dados de feedback.' }, { role: 'user', content: prompt }],
                temperature: 0.2,
            }),
        });
        if (!response.ok) throw new Error(`Falha na API da ${provider}: ${await response.text()}`);
        const data = await response.json();
        aiMessage = data.choices[0].message.content;

    } else if (provider === 'google') {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        if (!response.ok) throw new Error(`Falha na API da Google: ${await response.text()}`);
        const data = await response.json();
        aiMessage = data.candidates[0].content.parts[0].text;

    } else if (provider === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }],
                system: 'Você é um assistente analista de dados de feedback.',
            }),
        });
        if (!response.ok) throw new Error(`Falha na API da Anthropic: ${await response.text()}`);
        const data = await response.json();
        aiMessage = data.content[0].text;
    } else {
        throw new Error(`O provedor de IA '${provider}' não é suportado.`);
    }

    return new Response(JSON.stringify({ response: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função natural-language-query:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
