
CREATE TABLE public.uptime_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  status_code integer,
  response_time_ms integer,
  is_up boolean NOT NULL DEFAULT true,
  error_message text,
  alert_sent boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_uptime_checks_checked_at ON public.uptime_checks (checked_at DESC);

ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view uptime checks"
  ON public.uptime_checks
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
