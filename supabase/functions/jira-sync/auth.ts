
import { type SupabaseClient, type Integration } from './types.ts'

export async function getIntegration(
  supabaseClient: SupabaseClient,
  supabaseAdmin: SupabaseClient,
  integrationId: string,
  user: any // User object from supabase auth
): Promise<Integration> {
  let integration: Integration
  if (user) {
    // Manual sync: verify user owns the integration
    const { data, error } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single()
    if (error || !data) throw new Error('Integration not found or permission denied')
    integration = data as Integration
  } else {
    // Automated sync: fetch integration with admin rights
    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single()
    if (error || !data) throw new Error('Integration not found for automated sync')
    integration = data as Integration
  }
  return integration
}
