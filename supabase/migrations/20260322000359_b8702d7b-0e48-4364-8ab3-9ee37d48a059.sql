CREATE TABLE public.product_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_handle text NOT NULL,
  video_url text NOT NULL,
  poster_url text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_handle, video_url)
);

ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product videos"
  ON public.product_videos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active product videos"
  ON public.product_videos FOR SELECT
  TO public
  USING (is_active = true);

CREATE TRIGGER update_product_videos_updated_at
  BEFORE UPDATE ON public.product_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();