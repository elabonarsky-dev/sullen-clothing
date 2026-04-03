
CREATE TABLE public.artist_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  title text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_url text,
  scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist stories"
  ON public.artist_stories FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage artist stories"
  ON public.artist_stories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_artist_stories_updated_at
  BEFORE UPDATE ON public.artist_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
