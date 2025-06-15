
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
        .select('provider, model, api_key')
        .eq('user_id', feedback.user_id)
        .single();
    
    if (configError) throw configError;
    if (!aiConfig) throw new Error("Configuração de IA não encontrada para o usuário.");
    
    const { provider, model, api_key: userApiKey } = aiConfig;
    const apiKey = userApiKey || Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKey) throw new Error(`A chave da API para ${provider} não está configurada.`);

    const prompt = `
      Analise o seguinte feedback de usuário e retorne um objeto JSON válido com as seguintes chaves: "sentiment" (pode ser "positive", "negative", "neutral"), "summary" (um resumo de uma frase), e "tags" (um array de até 5 palavras-chave relevantes).

      Feedback:
      Título: ${feedback.title}
      Descrição: ${feedback.description}
    `;

    let aiResponseText = '';

    if (provider === 'openai' || provider === 'deepseek') {
        const apiUrl = provider === 'openai' 
            ? 'https://api.openai.com/v1/chat/completions' 
            : 'https://api.deepseek.com/v1/chat/completions';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'system', content: 'Você é um assistente especialista em análise de feedback de produto. Responda sempre em formato JSON válido.' }, { role: 'user', content: prompt }],
                response_format: { type: "json_object" },
            }),
        });
        if (!response.ok) throw new Error(`Falha na API da ${provider}: ${await response.text()}`);
        const data = await response.json();
        aiResponseText = data.choices[0].message.content;

    } else if (provider === 'google') {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        if (!response.ok) throw new Error(`Falha na API da Google: ${await response.text()}`);
        const data = await response.json();
        // A resposta da Gemini pode vir com ```json ... ```, então precisamos limpar.
        const cleanedText = data.candidates[0].content.parts[0].text.replace(/```json\n?|\n?```/g, '');
        aiResponseText = cleanedText;

    } else if (provider === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
                system: 'Você é um assistente especialista em análise de feedback de produto. Responda sempre em formato JSON válido.',
            }),
        });
        if (!response.ok) throw new Error(`Falha na API da Anthropic: ${await response.text()}`);
        const data = await response.json();
        aiResponseText = data.content[0].text;
    } else {
        throw new Error(`O provedor de IA '${provider}' não é suportado.`);
    }

    const analysis = JSON.parse(aiResponseText);

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
    console.error('Erro na função analyze-feedback:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
