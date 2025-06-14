
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Feedback {
  title: string
  description?: string
  customer_name?: string
  interviewee_name?: string
  conversation_at?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
      })
    }
    
    const { feedbacks } = await req.json() as { feedbacks: Feedback[] }
    if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum feedback fornecido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    // Use service role key to insert data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const feedbacksToInsert = feedbacks.map(fb => ({
      ...fb,
      user_id: user.id,
      source: 'manual',
      status: 'new'
    }))

    const { error } = await supabaseAdmin.from('feedbacks').insert(feedbacksToInsert)

    if (error) {
      console.error('Error inserting feedbacks:', error)
      throw new Error('Falha ao inserir feedbacks no banco de dados.')
    }
    
    return new Response(JSON.stringify({ message: `${feedbacks.length} feedbacks importados com sucesso.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
