
CREATE TABLE public.review_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL UNIQUE,
  summary text NOT NULL,
  review_count integer NOT NULL DEFAULT 0,
  avg_rating numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review summaries"
  ON public.review_summaries FOR SELECT TO public
  USING (true);

CREATE POLICY "Service role manages review summaries"
  ON public.review_summaries FOR ALL TO service_role
  USING (true) WITH CHECK (true);
