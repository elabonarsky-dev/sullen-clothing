
-- Create a public view for product Q&A that excludes customer email addresses
CREATE OR REPLACE VIEW public.product_qanda_public
WITH (security_invoker = on)
AS
SELECT
  id,
  product_id,
  questioner_name,
  question_body,
  question_created_at,
  answerer_name,
  answer_body,
  answer_created_at,
  answer_is_published,
  created_at
FROM public.product_qanda
WHERE (answer_is_published = true) OR (answer_body IS NULL);

-- Drop the overly permissive public SELECT policy on product_qanda
DROP POLICY IF EXISTS "Anyone can view published qanda" ON public.product_qanda;
