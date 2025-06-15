
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotionPage {
  id: string
  properties: any
  created_time: string
  last_edited_time: string
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

    const { apiToken, databaseId, titleProperty, descriptionProperty } = integration.config as any
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
      // Fetch pages from Notion database
      const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          sorts: [
            {
              property: 'last_edited_time',
              direction: 'descending'
            }
          ]
        })
      })

      if (!notionResponse.ok) {
        throw new Error(`Notion API error: ${notionResponse.statusText}`)
      }

      const notionData = await notionResponse.json()
      const pages: NotionPage[] = notionData.results || []

      let itemsCreated = 0
      let itemsUpdated = 0

      for (const page of pages) {
        const title = extractNotionTitle(page.properties, titleProperty)
        const description = extractNotionDescription(page.properties, descriptionProperty)
        const priority = extractNotionPriority(page.properties)
        const status = extractNotionStatus(page.properties)
        const tags = extractNotionTags(page.properties)

        const feedbackData = {
          user_id: userId,
          integration_id: integrationId,
          source: 'notion',
          external_id: page.id,
          title: title || 'Untitled',
          description: description || '',
          priority: priority,
          status: status,
          tags: tags,
          metadata: {
            notion_id: page.id,
            notion_url: `https://notion.so/${page.id.replace(/-/g, '')}`
          },
          external_created_at: page.created_time,
          external_updated_at: page.last_edited_time
        }

        // Check if feedback already exists
        const { data: existingFeedback } = await supabaseAdmin
          .from('feedbacks')
          .select('id')
          .eq('external_id', page.id)
          .eq('source', 'notion')
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
          items_processed: pages.length,
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
          processed: pages.length,
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

function extractNotionTitle(properties: any, titlePropertyName?: string): string {
  // If a specific title property name is provided, use it.
  if (titlePropertyName && properties[titlePropertyName] && properties[titlePropertyName].type === 'title') {
    const prop = properties[titlePropertyName];
    if (prop.title && prop.title[0] && prop.title[0].plain_text) {
      return prop.title[0].plain_text;
    }
  }
  
  // Fallback for backward compatibility or if no property is configured
  for (const value of Object.values(properties)) {
    const p = value as any;
    if (p && p.type === 'title') {
      if (p.title && p.title[0] && p.title[0].plain_text) {
        return p.title[0].plain_text;
      }
    }
  }
  return ''
}

function extractNotionDescription(properties: any, descriptionPropertyName?: string): string {
  // If a specific description property name is provided, use it.
  if (descriptionPropertyName && properties[descriptionPropertyName] && properties[descriptionPropertyName].type === 'rich_text') {
    const prop = properties[descriptionPropertyName];
    if (prop.rich_text) {
      return prop.rich_text.map((text: any) => text.plain_text).join('\n');
    }
  }

  // Fallback for backward compatibility: find the first rich_text property
  for (const value of Object.values(properties)) {
    const p = value as any;
    // ensure we are not picking up a title property, as they can also have rich_text
    if (p && p.type === 'rich_text') {
        if (p.rich_text) {
          return p.rich_text.map((text: any) => text.plain_text).join('\n');
        }
    }
  }
  return ''
}

function extractNotionPriority(properties: any): 'low' | 'medium' | 'high' | 'critical' {
  // Look for select property that might contain priority
  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase().includes('priority') && value && typeof value === 'object' && 'select' in value) {
      const select = (value as any).select
      if (select && select.name) {
        const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
          'Low': 'low',
          'Medium': 'medium',
          'High': 'high',
          'Critical': 'critical'
        }
        return priorityMap[select.name] || 'medium'
      }
    }
  }
  return 'medium'
}

function extractNotionStatus(properties: any): 'new' | 'in_progress' | 'resolved' | 'closed' {
  // Look for select property that might contain status
  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase().includes('status') && value && typeof value === 'object' && 'select' in value) {
      const select = (value as any).select
      if (select && select.name) {
        const statusMap: Record<string, 'new' | 'in_progress' | 'resolved' | 'closed'> = {
          'New': 'new',
          'To Do': 'new',
          'In Progress': 'in_progress',
          'Done': 'resolved',
          'Closed': 'closed'
        }
        return statusMap[select.name] || 'new'
      }
    }
  }
  return 'new'
}

function extractNotionTags(properties: any): string[] {
  // Look for multi_select property that might contain tags
  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase().includes('tag') && value && typeof value === 'object' && 'multi_select' in value) {
      const multiSelect = (value as any).multi_select
      if (multiSelect && Array.isArray(multiSelect)) {
        return multiSelect.map((tag: any) => tag.name).filter(Boolean)
      }
    }
  }
  return []
}
