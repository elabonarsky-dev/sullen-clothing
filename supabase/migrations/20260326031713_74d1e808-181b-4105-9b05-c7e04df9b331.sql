
-- Create storage bucket for product videos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true);

-- Allow public read access
CREATE POLICY "Product videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-videos' AND public.has_role(auth.uid(), 'admin'));
