
-- Vault access codes table
CREATE TABLE public.vault_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  min_tier text DEFAULT NULL,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  max_uses integer DEFAULT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  shopify_tag text DEFAULT 'vault-exclusive',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vault codes"
  ON public.vault_access_codes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can verify codes"
  ON public.vault_access_codes FOR SELECT TO authenticated
  USING (is_active = true);
