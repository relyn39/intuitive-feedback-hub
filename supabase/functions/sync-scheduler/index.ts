
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type Integration = {
  id: string
  name: string
  source: 'jira' | 'notion' | 'zoho'
  sync_frequency: 'manual' | 'hourly' | 'twice_daily' | 'daily'
  last_synced_at: string | null
  is_active: boolean
}

const SHOULD_SYNC = {
  manual: () => false,
  hourly: (lastSynced: Date, now: Date) => now.getTime() - lastSynced.getTime() > 60 * 60 * 1000,
  twice_daily: (lastSynced: Date, now: Date) => now.getTime() - lastSynced.getTime() > 12 * 60 * 60 * 1000,
  daily: (lastSynced: Date, now: Date) => now.getTime() - lastSynced.getTime() > 24 * 60 * 60 * 1000,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: integrations, error } = await supabaseAdmin.from('integrations').select('*').eq('is_active', true)

    if (error) throw error

    const now = new Date()

    for (const integration of integrations as Integration[]) {
      const lastSynced = integration.last_synced_at ? new Date(integration.last_synced_at) : new Date(0)
      const frequency = integration.sync_frequency

      if (SHOULD_SYNC[frequency](lastSynced, now)) {
        console.log(`Triggering sync for integration: ${integration.name} (${integration.id})`)
        const functionName = `${integration.source}-sync`
        
        // Invoke the function but don't wait for it to complete
        supabaseAdmin.functions.invoke(functionName, {
          body: { integrationId: integration.id },
        }).then(({ error: invokeError }) => {
           if (invokeError) {
             console.error(`Error invoking sync for integration ${integration.id}:`, invokeError.message)
           }
        })
      }
    }
    
    return new Response(JSON.stringify({ message: `Scheduler finished.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Scheduler error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

