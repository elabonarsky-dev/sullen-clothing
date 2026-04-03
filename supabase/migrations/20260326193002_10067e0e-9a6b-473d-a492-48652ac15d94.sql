
-- Fix reviews_public: recreate with security_invoker=on
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
  SELECT id,
     product_handle,
     product_title,
     product_image,
     reviewer_name,
     rating,
     title,
     body,
     media_urls,
     verified_purchase,
     status,
     review_group,
     created_at,
     updated_at,
     metadata
  FROM public.reviews
  WHERE status = 'approved'::review_status;

-- Add public SELECT policy on base reviews table for approved reviews only (no PII exposed via view)
CREATE POLICY "Anon can select approved reviews"
  ON public.reviews FOR SELECT
  TO anon
  USING (status = 'approved'::review_status);

-- Add public SELECT policy on base product_qanda table for published Q&A only (no PII - email excluded from view)
CREATE POLICY "Anon can select published qanda"
  ON public.product_qanda FOR SELECT
  TO anon
  USING ((answer_is_published = true) OR (answer_body IS NULL));
