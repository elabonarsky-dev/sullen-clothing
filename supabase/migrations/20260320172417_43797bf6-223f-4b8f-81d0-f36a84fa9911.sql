
CREATE TABLE public.cart_incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  threshold numeric NOT NULL DEFAULT 99,
  description text,
  icon text NOT NULL DEFAULT '🚚',
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_incentives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cart incentives"
  ON public.cart_incentives FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active cart incentives"
  ON public.cart_incentives FOR SELECT
  TO public
  USING (is_active = true);

INSERT INTO public.cart_incentives (label, type, threshold, description, icon, position, is_active)
VALUES 
  ('Free Shipping', 'shipping', 99, 'Free standard shipping on your order', '🚚', 0, true),
  ('Free Gift', 'gift', 150, 'Free Sullen sticker pack with your order', '🎁', 1, true);
