
-- Add scheduling columns to marketing_images
ALTER TABLE public.marketing_images
  ADD COLUMN scheduled_from timestamptz DEFAULT NULL,
  ADD COLUMN scheduled_until timestamptz DEFAULT NULL;

-- Add scheduling columns to featured_slides
ALTER TABLE public.featured_slides
  ADD COLUMN scheduled_from timestamptz DEFAULT NULL,
  ADD COLUMN scheduled_until timestamptz DEFAULT NULL;

-- Update the reviews_public view to include review_group (preserve existing)
-- Drop and recreate to include review_group
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
  SELECT id, product_handle, product_title, product_image, reviewer_name,
         rating, title, body, media_urls, verified_purchase, status,
         review_group, created_at, updated_at
  FROM public.reviews
  WHERE status = 'approved';
