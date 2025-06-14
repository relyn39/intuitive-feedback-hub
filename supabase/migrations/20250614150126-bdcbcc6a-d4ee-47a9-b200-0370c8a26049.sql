
-- Create an enum for AI providers for type safety
CREATE TYPE ai_provider AS ENUM ('openai');

-- Create the table to store AI configurations for each user
CREATE TABLE public.ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, -- Each user has one configuration
  provider ai_provider NOT NULL,
  model TEXT, -- e.g., 'gpt-4o-mini'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for ai_configurations
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI configuration"
  ON public.ai_configurations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a trigger to update the 'updated_at' column on changes
CREATE TRIGGER update_ai_configurations_updated_at
  BEFORE UPDATE ON public.ai_configurations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add a new column to the feedbacks table to store analysis results
ALTER TABLE public.feedbacks
ADD COLUMN analysis JSONB;
