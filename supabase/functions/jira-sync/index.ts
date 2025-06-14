import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description: string
    priority: { name: string }
    status: { name: string }
    created: string
    updated: string
    labels: string[]
  }
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
      // Manual sync: verify user owns the integration
      const { data, error } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single()
      if (error || !data) throw new Error('Integration not found or permission denied')
      integration = data
    } else {
      // Automated sync: fetch integration with admin rights
      const { data, error } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single()
      if (error || !data) throw new Error('Integration not found for automated sync')
      integration = data
    }

    const { jiraUrl, email, apiToken, jql } = integration.config as any
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
      // Fetch issues from Jira
      const jiraResponse = await fetch(`${jiraUrl}/rest/api/2/search?jql=${encodeURIComponent(jql || 'project IS NOT EMPTY ORDER BY updated DESC')}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${email}:${apiToken}`)}`,
          'Accept': 'application/json',
        },
      })

      if (!jiraResponse.ok) {
        throw new Error(`Jira API error: ${jiraResponse.statusText}`)
      }

      const jiraData = await jiraResponse.json()
      const issues: JiraIssue[] = jiraData.issues || []

      let itemsCreated = 0
      let itemsUpdated = 0

      for (const issue of issues) {
        const feedbackData = {
          user_id: userId,
          integration_id: integrationId,
          source: 'jira',
          external_id: issue.key,
          title: issue.fields.summary,
          description: issue.fields.description || '',
          priority: mapJiraPriority(issue.fields.priority?.name),
          status: mapJiraStatus(issue.fields.status?.name),
          tags: issue.fields.labels || [],
          metadata: {
            jira_id: issue.id,
            jira_key: issue.key,
            jira_status: issue.fields.status?.name,
            jira_priority: issue.fields.priority?.name
          },
          external_created_at: issue.fields.created,
          external_updated_at: issue.fields.updated
        }

        // Check if feedback already exists
        const { data: existingFeedback } = await supabaseAdmin
          .from('feedbacks')
          .select('id')
          .eq('external_id', issue.key)
          .eq('source', 'jira')
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
          items_processed: issues.length,
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
          processed: issues.length,
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

function mapJiraPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'Lowest': 'low',
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Highest': 'critical',
    'Critical': 'critical'
  }
  return priorityMap[priority] || 'medium'
}

function mapJiraStatus(status: string): 'new' | 'in_progress' | 'resolved' | 'closed' {
  const statusMap: Record<string, 'new' | 'in_progress' | 'resolved' | 'closed'> = {
    'To Do': 'new',
    'Open': 'new',
    'In Progress': 'in_progress',
    'Done': 'resolved',
    'Closed': 'closed',
    'Resolved': 'resolved'
  }
  return statusMap[status] || 'new'
}
