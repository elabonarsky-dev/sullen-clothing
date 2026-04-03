
CREATE TABLE public.bundle_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_handle text NOT NULL UNIQUE,
  label text NOT NULL,
  bundle_tag text NOT NULL,
  min_qty integer NOT NULL DEFAULT 4,
  discount_type text NOT NULL DEFAULT 'cheapest_free',
  fixed_amount numeric,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bundle_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bundle configs" ON public.bundle_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active bundle configs" ON public.bundle_configs
  FOR SELECT TO public
  USING (true);
