
-- Create enum for feedback sources
CREATE TYPE feedback_source AS ENUM ('jira', 'notion', 'zoho', 'manual');

-- Create enum for feedback status
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');

-- Create enum for feedback priority
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create integrations table to store API configurations
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source feedback_source NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- Store API keys, URLs, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, source, name)
);

-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  source feedback_source NOT NULL,
  external_id TEXT, -- ID from external system (Jira issue key, Notion page ID, etc.)
  title TEXT NOT NULL,
  description TEXT,
  status feedback_status DEFAULT 'new',
  priority feedback_priority DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}', -- Store additional data from external systems
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  external_created_at TIMESTAMP WITH TIME ZONE,
  external_updated_at TIMESTAMP WITH TIME ZONE
);

-- Create feedback_comments table for tracking updates
CREATE TABLE public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.feedbacks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sync_logs table for tracking synchronization
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for integrations
CREATE POLICY "Users can manage their own integrations" 
  ON public.integrations 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for feedbacks
CREATE POLICY "Users can manage their own feedbacks" 
  ON public.feedbacks 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for feedback_comments
CREATE POLICY "Users can manage comments on their feedbacks" 
  ON public.feedback_comments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.feedbacks 
      WHERE feedbacks.id = feedback_comments.feedback_id 
      AND feedbacks.user_id = auth.uid()
    )
  );

-- Create RLS policies for sync_logs
CREATE POLICY "Users can view their own sync logs" 
  ON public.sync_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.integrations 
      WHERE integrations.id = sync_logs.integration_id 
      AND integrations.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX idx_feedbacks_source ON public.feedbacks(source);
CREATE INDEX idx_feedbacks_status ON public.feedbacks(status);
CREATE INDEX idx_feedbacks_created_at ON public.feedbacks(created_at);
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_source ON public.integrations(source);
CREATE INDEX idx_feedback_comments_feedback_id ON public.feedback_comments(feedback_id);
CREATE INDEX idx_sync_logs_integration_id ON public.sync_logs(integration_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_integrations_updated_at 
  BEFORE UPDATE ON public.integrations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_feedbacks_updated_at 
  BEFORE UPDATE ON public.feedbacks 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
