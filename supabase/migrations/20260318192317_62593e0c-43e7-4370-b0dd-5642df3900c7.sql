CREATE TABLE public.site_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active themes"
  ON public.site_themes FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage themes"
  ON public.site_themes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_themes_updated_at
  BEFORE UPDATE ON public.site_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one theme active at a time
CREATE UNIQUE INDEX idx_one_active_theme ON public.site_themes (is_active) WHERE is_active = true;