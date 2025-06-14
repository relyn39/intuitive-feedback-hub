
ALTER TABLE public.feedbacks
ADD COLUMN customer_name TEXT,
ADD COLUMN interviewee_name TEXT,
ADD COLUMN conversation_at TIMESTAMP WITH TIME ZONE;
