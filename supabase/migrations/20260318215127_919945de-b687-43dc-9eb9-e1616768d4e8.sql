
-- Artist profile overrides (admin-editable fields that layer on top of static data)
CREATE TABLE public.artist_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  instagram TEXT,
  specialty TEXT,
  styles TEXT[] DEFAULT '{}',
  gallery_images TEXT[] DEFAULT '{}',
  portrait_url TEXT,
  studio TEXT,
  booking_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist profiles"
  ON public.artist_profiles FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage artist profiles"
  ON public.artist_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
