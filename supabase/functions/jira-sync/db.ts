
import { type SupabaseClient, type JiraIssue, type SyncLog } from './types.ts'
import { mapJiraPriority, mapJiraStatus } from './utils.ts'

export async function createInitialSyncLog(supabaseAdmin: SupabaseClient, integrationId: string): Promise<SyncLog> {
    const { data: syncLog, error: syncLogError } = await supabaseAdmin
      .from('sync_logs')
      .insert({
        integration_id: integrationId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (syncLogError) {
      throw new Error(`Failed to create sync log: ${syncLogError.message}`)
    }
    return syncLog
}

export async function processJiraIssues(
    supabaseAdmin: SupabaseClient,
    issues: JiraIssue[],
    userId: string,
    integrationId: string
): Promise<{ itemsCreated: number, itemsUpdated: number }> {
    let itemsCreated = 0
    let itemsUpdated = 0

    for (const issue of issues) {
        const feedbackData = {
          user_id: userId,
          integration_id: integrationId,
          source: 'jira' as const,
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

        const { data: existingFeedback, error: selectError } = await supabaseAdmin
          .from('feedbacks')
          .select('id')
          .eq('external_id', issue.key)
          .eq('source', 'jira')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (selectError) {
          console.error(`Error checking for existing feedback for issue ${issue.key}:`, selectError)
          continue;
        }

        if (existingFeedback) {
          const { error: updateError } = await supabaseAdmin
            .from('feedbacks')
            .update(feedbackData)
            .eq('id', existingFeedback.id)
          if(updateError) console.error(`Error updating feedback for issue ${issue.key}:`, updateError)
          else itemsUpdated++
        } else {
          const { error: insertError } = await supabaseAdmin
            .from('feedbacks')
            .insert(feedbackData)
          if(insertError) console.error(`Error inserting feedback for issue ${issue.key}:`, insertError)
          else itemsCreated++
        }
    }

    return { itemsCreated, itemsUpdated }
}

export async function updateSyncLogSuccess(
    supabaseAdmin: SupabaseClient,
    syncLogId: string,
    results: { itemsProcessed: number, itemsCreated: number, itemsUpdated: number }
) {
    await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'success',
          items_processed: results.itemsProcessed,
          items_created: results.itemsCreated,
          items_updated: results.itemsUpdated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLogId)
}

export async function updateSyncLogError(supabaseAdmin: SupabaseClient, syncLogId: string, error: Error) {
    await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'error',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLogId)
}

export async function updateIntegrationLastSynced(supabaseAdmin: SupabaseClient, integrationId: string) {
    await supabaseAdmin
      .from('integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integrationId)
}
