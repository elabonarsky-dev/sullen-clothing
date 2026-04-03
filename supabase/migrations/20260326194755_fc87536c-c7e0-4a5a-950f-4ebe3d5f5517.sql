-- Recreate product_qanda_public view with security_invoker to fix security definer finding
DROP VIEW IF EXISTS public.product_qanda_public;
CREATE VIEW public.product_qanda_public
WITH (security_invoker=on) AS
  SELECT id,
    product_id,
    questioner_name,
    question_body,
    question_created_at,
    answerer_name,
    answer_body,
    answer_created_at,
    answer_is_published,
    created_at
  FROM product_qanda
  WHERE (answer_is_published = true) OR (answer_body IS NULL);