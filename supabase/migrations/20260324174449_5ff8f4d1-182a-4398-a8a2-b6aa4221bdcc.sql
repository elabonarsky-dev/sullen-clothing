CREATE TABLE public.capsule_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  collection_handle text NOT NULL,
  drop_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  teaser_label text DEFAULT 'Incoming Drop',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capsule_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active drops"
  ON public.capsule_drops
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage drops"
  ON public.capsule_drops
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_capsule_drops_updated_at
  BEFORE UPDATE ON public.capsule_drops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();