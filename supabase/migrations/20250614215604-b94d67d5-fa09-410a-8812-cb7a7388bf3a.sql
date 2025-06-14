
-- Create a new type for sync frequency options
CREATE TYPE public.integration_sync_frequency AS ENUM ('manual', 'hourly', 'twice_daily', 'daily');

-- Add a column to the integrations table to store the chosen frequency
ALTER TABLE public.integrations
ADD COLUMN sync_frequency public.integration_sync_frequency NOT NULL DEFAULT 'manual';

-- Add a column to track when the last sync happened
ALTER TABLE public.integrations
ADD COLUMN last_synced_at timestamptz;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage of the extension to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Grant all on cron.job table to postgres user
GRANT ALL ON TABLE cron.job TO postgres;

-- Enable pg_net extension for network requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule a cron job to run every hour and trigger our sync scheduler function.
-- The 'sync-scheduler' function will be created in the next step.
-- The ANON_KEY is safe to be used here as it's a public key.
SELECT cron.schedule(
  'integration-sync-scheduler',
  '0 * * * *', -- This runs at the beginning of every hour
  $$
  SELECT
    net.http_post(
      url := 'https://saepfmuqeywmyhmjzgkr.supabase.co/functions/v1/sync-scheduler',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZXBmbXVxZXl3bXlobWp6Z2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDM0MDUsImV4cCI6MjA2MzkxOTQwNX0.qpZe9WRNNfneUbnok47oDdYbZJXsAxBL3eUVyD2Cx6E"}'::jsonb
    )
  $$
);
