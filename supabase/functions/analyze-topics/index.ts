import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
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
        .select('provider, model, api_key')
        .eq('user_id', user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");

    const { provider, model, api_key: userApiKey } = aiConfig;
    const apiKey = userApiKey || Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKey) throw new Error(`A chave da API para ${provider} não está configurada.`);

    // 3. Format data for the prompt
    const feedbackDataString = feedbacks.map(fb => {
      return `Título: ${fb.title}\nAnálise: ${JSON.stringify(fb.analysis)}`;
    }).join('\n\n---\n\n');

    // 4. Create the prompt for the AI
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
                temperature: 0.3,
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
    console.error('Erro na função analyze-topics:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
