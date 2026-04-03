
-- 1. Create a public-safe view excluding sensitive columns
CREATE VIEW public.reviews_public
WITH (security_invoker = false)
AS
  SELECT
    id,
    rating,
    title,
    body,
    product_handle,
    product_image,
    product_title,
    reviewer_name,
    verified_purchase,
    media_urls,
    status,
    created_at,
    updated_at,
    user_id
  FROM public.reviews
  WHERE status = 'approved';

-- 2. Drop the overly permissive public SELECT policy on the base table
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;

-- 3. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.reviews_public TO anon, authenticated;
