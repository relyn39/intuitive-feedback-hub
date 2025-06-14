
-- Create an enum type for insight severity for consistency
CREATE TYPE insight_severity AS ENUM ('info', 'warning', 'success', 'error');

-- Create an enum type for insight type
CREATE TYPE insight_type AS ENUM ('trend', 'alert', 'opportunity', 'other');

-- Create the table to store generated insights
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type insight_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity insight_severity NOT NULL,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.insights IS 'Stores AI-generated insights based on user feedback.';
COMMENT ON COLUMN public.insights.user_id IS 'The user who owns this insight.';
COMMENT ON COLUMN public.insights.type IS 'The category of the insight (e.g., trend, alert).';
COMMENT ON COLUMN public.insights.severity IS 'The severity level of the insight (e.g., info, warning).';
COMMENT ON COLUMN public.insights.action IS 'A suggested action based on the insight.';


-- Enable Row Level Security (RLS) for the new table
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own insights
CREATE POLICY "Users can view their own insights"
  ON public.insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE/DELETE will be handled by a secure backend function,
-- so we are not creating policies for users to modify this data directly.
