
-- Add 'survey' to reward_transaction_type enum
ALTER TYPE public.reward_transaction_type ADD VALUE IF NOT EXISTS 'survey';

-- Create customer_surveys table to store survey responses
CREATE TABLE public.customer_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  points_awarded integer NOT NULL DEFAULT 75,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint so each user can only complete once
ALTER TABLE public.customer_surveys ADD CONSTRAINT customer_surveys_user_id_unique UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.customer_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own survey
CREATE POLICY "Users can submit own survey"
ON public.customer_surveys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own survey
CREATE POLICY "Users can view own survey"
ON public.customer_surveys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all surveys
CREATE POLICY "Admins can view all surveys"
ON public.customer_surveys FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role manages surveys"
ON public.customer_surveys FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
