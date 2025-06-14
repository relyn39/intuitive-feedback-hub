
import { type SupabaseClient as SupabaseClientClass } from "https://esm.sh/@supabase/supabase-js@2"

export type SupabaseClient = SupabaseClientClass

export interface JiraIssue {
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

export interface Integration {
    id: string;
    user_id: string;
    config: {
        jiraUrl?: string;
        email?: string;
        apiToken?: string;
        jql?: string;
    };
    last_synced_at?: string;
}

export interface SyncLog {
    id: string;
}
