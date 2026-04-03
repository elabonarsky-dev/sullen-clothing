
-- Create featured_slides table for multi-slide featured carousel
CREATE TABLE public.featured_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'collection')),
  handle text NOT NULL,
  label text,
  background_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_slides ENABLE ROW LEVEL SECURITY;

-- Admins manage
CREATE POLICY "Admins can manage featured slides"
ON public.featured_slides FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public read active
CREATE POLICY "Anyone can view active featured slides"
ON public.featured_slides FOR SELECT TO public
USING (is_active = true);

-- Seed with current featured settings (cherubs collection)
INSERT INTO public.featured_slides (position, type, handle, label)
VALUES (0, 'collection', 'cherubs-capsule', 'Cherubs Capsule');
