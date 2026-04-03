
-- Make user_id nullable on reviews to support imported reviews without accounts
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- Create product Q&A table
CREATE TABLE public.product_qanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  question_body text NOT NULL,
  questioner_name text NOT NULL DEFAULT '',
  questioner_email text,
  question_created_at timestamptz NOT NULL DEFAULT now(),
  answer_body text,
  answerer_name text,
  answer_created_at timestamptz,
  answer_is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_qanda ENABLE ROW LEVEL SECURITY;

-- Public can read published Q&A
CREATE POLICY "Anyone can view published qanda"
  ON public.product_qanda FOR SELECT TO public
  USING (answer_is_published = true OR answer_body IS NULL);

-- Admins can manage Q&A
CREATE POLICY "Admins can manage qanda"
  ON public.product_qanda FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role for imports
CREATE POLICY "Service role manages qanda"
  ON public.product_qanda FOR ALL TO service_role
  USING (true) WITH CHECK (true);
