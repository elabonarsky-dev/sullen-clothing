-- Color swatch library table
CREATE TABLE public.color_swatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color_name text NOT NULL UNIQUE,
  hex_fallback text DEFAULT '#888888',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.color_swatches ENABLE ROW LEVEL SECURITY;

-- Anyone can view swatches (needed for product cards)
CREATE POLICY "Anyone can view color swatches"
  ON public.color_swatches FOR SELECT TO public USING (true);

-- Admins can manage swatches
CREATE POLICY "Admins can manage color swatches"
  ON public.color_swatches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for swatch images
INSERT INTO storage.buckets (id, name, public)
VALUES ('color-swatches', 'color-swatches', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view swatch images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'color-swatches');

CREATE POLICY "Admins can upload swatch images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'color-swatches' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete swatch images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'color-swatches' AND public.has_role(auth.uid(), 'admin'));