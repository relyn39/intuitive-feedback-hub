
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getIntegration } from './auth.ts'
import { fetchJiraIssues } from './jira.ts'
import {
  createInitialSyncLog,
  processJiraIssues,
  updateSyncLogSuccess,
  updateSyncLogError,
  updateIntegrationLastSynced
} from './db.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let syncLogId: string | null = null

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    const { integrationId } = await req.json()
    if (!integrationId) {
      throw new Error('integrationId is required')
    }

    const integration = await getIntegration(supabaseClient, supabaseAdmin, integrationId, user)
    
    const syncLog = await createInitialSyncLog(supabaseAdmin, integrationId)
    syncLogId = syncLog.id

    try {
      const issues = await fetchJiraIssues(integration)
      
      const { itemsCreated, itemsUpdated } = await processJiraIssues(
        supabaseAdmin,
        issues,
        integration.user_id,
        integration.id
      )

      await updateSyncLogSuccess(supabaseAdmin, syncLog.id, {
          itemsProcessed: issues.length,
          itemsCreated,
          itemsUpdated,
      })
      
      await updateIntegrationLastSynced(supabaseAdmin, integration.id)

      return new Response(
        JSON.stringify({
          success: true,
          processed: issues.length,
          created: itemsCreated,
          updated: itemsUpdated
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      if (syncLogId) {
        await updateSyncLogError(supabaseAdmin, syncLogId, error)
      }
      throw error
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
