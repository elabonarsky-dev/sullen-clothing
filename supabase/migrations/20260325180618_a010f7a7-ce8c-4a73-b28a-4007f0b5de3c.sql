
DROP VIEW IF EXISTS public.reviews_public;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE VIEW public.reviews_public AS
SELECT
  id, product_handle, product_title, product_image,
  reviewer_name, rating, title, body, media_urls,
  verified_purchase, status, review_group, created_at, updated_at, metadata
FROM public.reviews
WHERE status = 'approved'::review_status;

GRANT SELECT ON public.reviews_public TO anon, authenticated;
