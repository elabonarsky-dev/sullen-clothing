
CREATE TABLE public.okendo_migration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  corrected_balance integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'Apprentice',
  total_order_value numeric NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  points_spent integer NOT NULL DEFAULT 0,
  claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamp with time zone,
  claimed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_okendo_migration_email ON public.okendo_migration (LOWER(email));

ALTER TABLE public.okendo_migration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage okendo migration"
  ON public.okendo_migration
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages okendo migration"
  ON public.okendo_migration
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
