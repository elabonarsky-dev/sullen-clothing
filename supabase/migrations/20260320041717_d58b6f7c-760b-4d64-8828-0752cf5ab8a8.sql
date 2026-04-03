
-- Review status enum
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- Internal reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_handle TEXT NOT NULL,
  product_title TEXT NOT NULL,
  product_image TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status review_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-approve 4-5 star reviews trigger
CREATE OR REPLACE FUNCTION public.auto_approve_high_rating_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.rating >= 4 THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_approve_reviews
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_high_rating_reviews();

-- Updated_at trigger
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT TO public
  USING (status = 'approved');

-- Authenticated users can submit reviews
CREATE POLICY "Users can submit reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Aggregate function for store-wide stats
CREATE OR REPLACE FUNCTION public.get_review_aggregate(p_product_handle TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'reviewCount', COUNT(*)::integer,
    'avgRating', ROUND(COALESCE(AVG(rating), 0)::numeric, 1),
    'ratingCounts', json_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    )
  )
  FROM public.reviews
  WHERE status = 'approved'
    AND (p_product_handle IS NULL OR product_handle = p_product_handle)
$$;
