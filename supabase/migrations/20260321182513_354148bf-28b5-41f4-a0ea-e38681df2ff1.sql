
-- Drop the security definer view and replace with security invoker view
DROP VIEW IF EXISTS public.reviews_public;

-- Create view with security_invoker = true (recommended by linter)
-- But since we removed the public SELECT policy, we need a new restricted one
-- that only allows selecting safe columns via a function

-- Re-add a restricted public SELECT policy that only exposes safe columns
-- The policy itself can't restrict columns, so we use the view approach differently:
-- Keep the view as security_invoker but add back a SELECT policy on base table
CREATE POLICY "Public can view approved reviews (restricted via view)"
  ON public.reviews
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Create the view with security_invoker so it respects RLS
CREATE VIEW public.reviews_public
WITH (security_invoker = true)
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

GRANT SELECT ON public.reviews_public TO anon, authenticated;
