
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { type FeedbackPayload } from './types.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const integrationId = pathParts[pathParts.length - 1]

    if (!integrationId) {
        return new Response(JSON.stringify({ error: 'ID da integração ausente no URL.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
        .from('integrations')
        .select('user_id')
        .eq('id', integrationId)
        .single()

    if (integrationError || !integration) {
        return new Response(JSON.stringify({ error: 'Integração não encontrada.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        })
    }

    const { feedbacks } = await req.json() as { feedbacks: FeedbackPayload[] }
    if (!feedbacks || !Array.isArray(feedbacks)) {
      return new Response(JSON.stringify({ error: 'Payload de feedbacks inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const feedbacksToUpsert = feedbacks.map(fb => ({
      ...fb,
      external_created_at: fb.created_at,
      user_id: integration.user_id,
      integration_id: integrationId,
      source: 'zapier',
      status: 'new',
    }))

    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .upsert(feedbacksToUpsert, { onConflict: 'integration_id,external_id', ignoreDuplicates: false })
      .select('id')

    if (error) throw error

    return new Response(JSON.stringify({ message: `${data?.length || 0} feedbacks processados com sucesso.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
