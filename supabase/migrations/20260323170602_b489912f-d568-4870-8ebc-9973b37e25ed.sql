
-- Create artist-portraits storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-portraits', 'artist-portraits', true);

-- Allow anyone to read from artist-portraits bucket
CREATE POLICY "Anyone can view artist portraits"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artist-portraits');

-- Allow admins to upload/update/delete artist portraits
CREATE POLICY "Admins can manage artist portraits"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'artist-portraits' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'artist-portraits' AND public.has_role(auth.uid(), 'admin'));

-- Add stored_portrait_url column to artist_profiles
ALTER TABLE public.artist_profiles
ADD COLUMN stored_portrait_url text DEFAULT NULL;
