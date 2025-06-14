import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZohoTicket {
  id: string
  subject: string
  description: string
  priority: string
  status: string
  createdTime: string
  modifiedTime: string
  category?: string
  tags?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

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
    
    let integration
    if (user) {
      const { data, error } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single()
      if (error || !data) throw new Error('Integration not found or permission denied')
      integration = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single()
      if (error || !data) throw new Error('Integration not found for automated sync')
      integration = data
    }

    const { accessToken, orgId, departmentId } = integration.config as any
    const userId = integration.user_id

    // Create sync log
    const { data: syncLog, error: syncLogError } = await supabaseAdmin
      .from('sync_logs')
      .insert({
        integration_id: integrationId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (syncLogError) {
      throw new Error('Failed to create sync log')
    }

    try {
      // Fetch tickets from Zoho Desk
      const zohoResponse = await fetch(
        `https://desk.zoho.com/api/v1/tickets?departmentId=${departmentId}&sortBy=modifiedTime&limit=100`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'orgId': orgId,
          },
        }
      )

      if (!zohoResponse.ok) {
        throw new Error(`Zoho API error: ${zohoResponse.statusText}`)
      }

      const zohoData = await zohoResponse.json()
      const tickets: ZohoTicket[] = zohoData.data || []

      let itemsCreated = 0
      let itemsUpdated = 0

      for (const ticket of tickets) {
        const feedbackData = {
          user_id: userId,
          integration_id: integrationId,
          source: 'zoho',
          external_id: ticket.id,
          title: ticket.subject,
          description: ticket.description || '',
          priority: mapZohoPriority(ticket.priority),
          status: mapZohoStatus(ticket.status),
          tags: ticket.tags || [],
          metadata: {
            zoho_id: ticket.id,
            zoho_category: ticket.category,
            zoho_status: ticket.status,
            zoho_priority: ticket.priority
          },
          external_created_at: ticket.createdTime,
          external_updated_at: ticket.modifiedTime
        }

        // Check if feedback already exists
        const { data: existingFeedback } = await supabaseAdmin
          .from('feedbacks')
          .select('id')
          .eq('external_id', ticket.id)
          .eq('source', 'zoho')
          .eq('user_id', userId)
          .single()

        if (existingFeedback) {
          // Update existing feedback
          await supabaseAdmin
            .from('feedbacks')
            .update(feedbackData)
            .eq('id', existingFeedback.id)
          itemsUpdated++
        } else {
          // Create new feedback
          await supabaseAdmin
            .from('feedbacks')
            .insert(feedbackData)
          itemsCreated++
        }
      }

      // Update sync log
      await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'success',
          items_processed: tickets.length,
          items_created: itemsCreated,
          items_updated: itemsUpdated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      // Update last_synced_at on the integration
      await supabaseAdmin
        .from('integrations')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', integration.id)

      return new Response(
        JSON.stringify({
          success: true,
          processed: tickets.length,
          created: itemsCreated,
          updated: itemsUpdated
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      // Update sync log with error
      await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'error',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      throw error
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function mapZohoPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Urgent': 'critical',
    'Critical': 'critical'
  }
  return priorityMap[priority] || 'medium'
}

function mapZohoStatus(status: string): 'new' | 'in_progress' | 'resolved' | 'closed' {
  const statusMap: Record<string, 'new' | 'in_progress' | 'resolved' | 'closed'> = {
    'Open': 'new',
    'In Progress': 'in_progress',
    'On Hold': 'in_progress',
    'Closed': 'closed',
    'Resolved': 'resolved'
  }
  return statusMap[status] || 'new'
}
