
-- Add 'claude' and 'deepseek' to the list of supported AI providers
ALTER TYPE public.ai_provider ADD VALUE IF NOT EXISTS 'claude';
ALTER TYPE public.ai_provider ADD VALUE IF NOT EXISTS 'deepseek';
