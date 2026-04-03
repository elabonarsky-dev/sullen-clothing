
-- Issue logs table: stores every issue from any source
CREATE TABLE public.issue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'concierge', -- 'concierge', 'return', 'support'
  category text, -- AI-classified category
  summary text NOT NULL,
  customer_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Issue patterns table: aggregated recurring issues
CREATE TABLE public.issue_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  occurrence_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'monitoring'
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_patterns ENABLE ROW LEVEL SECURITY;

-- Admins can manage both tables
CREATE POLICY "Admins can manage issue logs" ON public.issue_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages issue logs" ON public.issue_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage issue patterns" ON public.issue_patterns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages issue patterns" ON public.issue_patterns
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Allow anon/public insert into issue_logs (for concierge logging without auth)
CREATE POLICY "Anyone can log issues" ON public.issue_logs
  FOR INSERT TO public
  WITH CHECK (true);

-- Updated_at trigger for issue_patterns
CREATE TRIGGER update_issue_patterns_updated_at
  BEFORE UPDATE ON public.issue_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
