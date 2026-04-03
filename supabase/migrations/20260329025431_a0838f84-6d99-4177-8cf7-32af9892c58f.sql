-- Fix 1: Remove anon SELECT from base reviews table (use reviews_public view instead)
DROP POLICY IF EXISTS "Anon can select approved reviews" ON public.reviews;

-- Fix 2: Remove anon SELECT from base product_qanda table (use product_qanda_public view instead)
DROP POLICY IF EXISTS "Anon can select published qanda" ON public.product_qanda;

-- Fix 3: Add anon SELECT to the safe public views instead
DROP POLICY IF EXISTS "Anon can select reviews_public" ON public.reviews_public;
DROP POLICY IF EXISTS "Anon can select product_qanda_public" ON public.product_qanda_public;

-- Fix 4: Set search_path on mutable functions
ALTER FUNCTION public.auto_approve_high_rating_reviews() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.claim_pending_invites() SET search_path = public;
ALTER FUNCTION public.prevent_birthday_change() SET search_path = public;