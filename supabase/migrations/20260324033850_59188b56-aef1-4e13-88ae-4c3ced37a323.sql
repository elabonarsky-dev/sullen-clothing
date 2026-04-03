-- Add review_group column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_group text;

-- Create index for fast grouped queries
CREATE INDEX IF NOT EXISTS idx_reviews_review_group ON public.reviews (review_group) WHERE status = 'approved';

-- Also add to the public view
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
  SELECT id, rating, title, body, reviewer_name, verified_purchase, created_at,
         product_handle, product_title, product_image, media_urls, status, updated_at, review_group
  FROM public.reviews
  WHERE status = 'approved';
