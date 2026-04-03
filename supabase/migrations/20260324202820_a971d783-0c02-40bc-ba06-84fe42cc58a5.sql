INSERT INTO storage.buckets (id, name, public) VALUES ('sfx', 'sfx', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read sfx" ON storage.objects FOR SELECT TO public USING (bucket_id = 'sfx');

CREATE POLICY "Admins can manage sfx" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'sfx' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'sfx' AND public.has_role(auth.uid(), 'admin'));