
-- Create enum for image slot types
CREATE TYPE public.marketing_image_slot AS ENUM (
  'hero_slider',
  'collection_row',
  'featured_product',
  'category_link',
  'mega_menu_featured'
);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Marketing images table
CREATE TABLE public.marketing_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot marketing_image_slot NOT NULL,
  position INT NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_href TEXT,
  alt_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_images ENABLE ROW LEVEL SECURITY;

-- Everyone can read active marketing images
CREATE POLICY "Anyone can view active marketing images"
  ON public.marketing_images FOR SELECT
  USING (is_active = true);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admins can do everything on marketing_images
CREATE POLICY "Admins can manage marketing images"
  ON public.marketing_images FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can read all marketing images (including inactive)
CREATE POLICY "Admins can view all marketing images"
  ON public.marketing_images FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: users can see their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_marketing_images_updated_at
  BEFORE UPDATE ON public.marketing_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for marketing images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-images', 'marketing-images', true);

CREATE POLICY "Anyone can view marketing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-images');

CREATE POLICY "Admins can upload marketing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update marketing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete marketing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketing-images' AND public.has_role(auth.uid(), 'admin'));
