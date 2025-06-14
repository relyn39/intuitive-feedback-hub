
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { integrationId } = await req.json()

    // Get integration config
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single()

    if (integrationError || !integration) {
      throw new Error('Integration not found')
    }

    const { apiToken, databaseId } = integration.config as any

    // Create sync log
    const { data: syncLog, error: syncLogError } = await supabaseClient
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
        const title = extractNotionTitle(page.properties)
        const description = extractNotionDescription(page.properties)
        const priority = extractNotionPriority(page.properties)
        const status = extractNotionStatus(page.properties)
        const tags = extractNotionTags(page.properties)

        const feedbackData = {
          user_id: user.id,
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
        const { data: existingFeedback } = await supabaseClient
          .from('feedbacks')
          .select('id')
          .eq('external_id', page.id)
          .eq('source', 'notion')
          .eq('user_id', user.id)
          .single()

        if (existingFeedback) {
          // Update existing feedback
          await supabaseClient
            .from('feedbacks')
            .update(feedbackData)
            .eq('id', existingFeedback.id)
          itemsUpdated++
        } else {
          // Create new feedback
          await supabaseClient
            .from('feedbacks')
            .insert(feedbackData)
          itemsCreated++
        }
      }

      // Update sync log
      await supabaseClient
        .from('sync_logs')
        .update({
          status: 'success',
          items_processed: pages.length,
          items_created: itemsCreated,
          items_updated: itemsUpdated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

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
      await supabaseClient
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

function extractNotionTitle(properties: any): string {
  // Look for title property
  for (const [key, value] of Object.entries(properties)) {
    if (value && typeof value === 'object' && 'title' in value) {
      const title = (value as any).title
      if (title && title[0] && title[0].plain_text) {
        return title[0].plain_text
      }
    }
  }
  return ''
}

function extractNotionDescription(properties: any): string {
  // Look for rich_text property that might contain description
  for (const [key, value] of Object.entries(properties)) {
    if (value && typeof value === 'object' && 'rich_text' in value) {
      const richText = (value as any).rich_text
      if (richText && richText[0] && richText[0].plain_text) {
        return richText[0].plain_text
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
