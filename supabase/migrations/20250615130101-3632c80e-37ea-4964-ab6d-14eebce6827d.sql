
ALTER TABLE public.ai_configurations
ADD COLUMN api_key TEXT;

COMMENT ON COLUMN public.ai_configurations.api_key IS 'Stores the user-provided API key for the selected LLM provider. The key is stored in plaintext, but access is restricted by RLS policies to the owner only.';
