ALTER TABLE public.marketing_images
  ADD COLUMN video_url text DEFAULT NULL,
  ADD COLUMN mobile_video_url text DEFAULT NULL;