
import { type JiraIssue, type Integration } from './types.ts'

function buildJql(jql: string | undefined, lastSyncedAt: string | undefined): string {
    const baseJql = (jql || 'project IS NOT EMPTY').split(/ order by /i)[0].trim()
    let finalJql = baseJql

    if (lastSyncedAt) {
      const lastSyncedDate = new Date(lastSyncedAt)
      // Go back 5 minutes to avoid clock skew issues
      lastSyncedDate.setMinutes(lastSyncedDate.getMinutes() - 5)
      // Format to "YYYY-MM-DD HH:mm"
      const formattedDate = lastSyncedDate.toISOString().substring(0, 16).replace('T', ' ')
      finalJql = `(${baseJql}) AND updated >= "${formattedDate}"`
    }

    // We always order by `updated DESC` to process the most recent items first.
    return `${finalJql} ORDER BY updated DESC`
}

export async function fetchJiraIssues(integration: Integration): Promise<JiraIssue[]> {
    const { jiraUrl, email, apiToken, jql } = integration.config
    const fullJql = buildJql(jql, integration.last_synced_at)

    const jiraResponse = await fetch(`${jiraUrl}/rest/api/2/search?jql=${encodeURIComponent(fullJql)}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${email}:${apiToken}`)}`,
          'Accept': 'application/json',
        },
      })

    if (!jiraResponse.ok) {
        const errorBody = await jiraResponse.text()
        console.error("Jira API Error:", errorBody)
        throw new Error(`Jira API error: ${jiraResponse.status} ${jiraResponse.statusText}`)
    }

    const jiraData = await jiraResponse.json()
    return jiraData.issues || []
}
