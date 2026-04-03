-- 1. Fix site_settings: remove sensitive keys from public SELECT allowlist
DROP POLICY IF EXISTS "Anyone can read safe site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read safe site_settings"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (
    key = ANY (ARRAY[
      'featured_product_handle',
      'featured_type',
      'featured_collection_handle',
      'site_theme',
      'announcement_enabled',
      'maintenance_mode'
    ])
  );

-- 2. Fix reviews_public: drop user_id from the view
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
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
    updated_at
  FROM public.reviews
  WHERE status = 'approved'::review_status;

-- Grant read access on the view
GRANT SELECT ON public.reviews_public TO anon, authenticated;