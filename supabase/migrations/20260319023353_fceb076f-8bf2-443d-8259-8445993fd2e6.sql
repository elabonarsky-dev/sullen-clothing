
CREATE TABLE public.back_in_stock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  variant_id text NOT NULL,
  product_handle text NOT NULL,
  product_title text NOT NULL,
  variant_title text,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anyone to insert (no auth required for email capture)
ALTER TABLE public.back_in_stock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request back in stock notifications"
  ON public.back_in_stock_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all requests"
  ON public.back_in_stock_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
  ON public.back_in_stock_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
