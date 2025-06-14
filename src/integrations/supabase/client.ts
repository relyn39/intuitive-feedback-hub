
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://saepfmuqeywmyhmjzgkr.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZXBmbXVxZXl3bXlobWp6Z2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDM0MDUsImV4cCI6MjA2MzkxOTQwNX0.qpZe9WRNNfneUbnok47oDdYbZJXsAxBL3eUVyD2Cx6E"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
