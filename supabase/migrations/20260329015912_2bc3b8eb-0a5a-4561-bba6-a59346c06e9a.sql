
-- Order history table: lightweight summaries captured from order webhooks
CREATE TABLE public.order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  order_id text NOT NULL,
  order_name text NOT NULL,
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  total_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  financial_status text DEFAULT 'paid',
  fulfillment_status text DEFAULT 'unfulfilled',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_address jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Index for fast lookups by email and user_id
CREATE INDEX idx_order_history_email ON public.order_history (email);
CREATE INDEX idx_order_history_user_id ON public.order_history (user_id);

-- Enable RLS
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders (matched by user_id)
CREATE POLICY "Users can view own orders"
  ON public.order_history FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR LOWER(email) = LOWER(auth.email())
  );

-- Service role manages order_history (webhooks write with service role)
CREATE POLICY "Service role manages order_history"
  ON public.order_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.order_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- CS can view orders
CREATE POLICY "CS can view orders"
  ON public.order_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'customer_service'::app_role));
