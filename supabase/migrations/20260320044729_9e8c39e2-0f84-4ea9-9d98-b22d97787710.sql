
-- Review request tokens for post-purchase email flow
CREATE TABLE public.review_request_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  order_id text NOT NULL,
  order_name text NOT NULL,
  email text NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'completed', 'expired'))
);

-- Index for token lookup
CREATE INDEX idx_review_request_tokens_token ON public.review_request_tokens(token);
CREATE INDEX idx_review_request_tokens_order ON public.review_request_tokens(order_id);

-- RLS
ALTER TABLE public.review_request_tokens ENABLE ROW LEVEL SECURITY;

-- Public can read by token (for the review page)
CREATE POLICY "Anyone can view by token"
  ON public.review_request_tokens
  FOR SELECT
  TO public
  USING (true);

-- Service role manages
CREATE POLICY "Service role manages review requests"
  ON public.review_request_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can manage
CREATE POLICY "Admins can manage review requests"
  ON public.review_request_tokens
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
