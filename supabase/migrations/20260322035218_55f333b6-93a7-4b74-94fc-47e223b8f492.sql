CREATE TABLE public.cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  deleted_count integer NOT NULL DEFAULT 0,
  active_count integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cleanup logs" ON public.cleanup_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages cleanup logs" ON public.cleanup_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);