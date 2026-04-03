
-- Reward transaction types
CREATE TYPE public.reward_transaction_type AS ENUM (
  'signup_bonus',
  'purchase',
  'review',
  'referral',
  'social_follow',
  'birthday',
  'redemption',
  'admin_adjustment',
  'okendo_import'
);

-- Core transactions table (ledger-style, balance = SUM of all points)
CREATE TABLE public.reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  type reward_transaction_type NOT NULL,
  description text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- VIP tier definitions
CREATE TABLE public.reward_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🩻',
  min_lifetime_spend numeric NOT NULL DEFAULT 0,
  earn_rate numeric NOT NULL DEFAULT 2,
  position integer NOT NULL DEFAULT 0,
  perks text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Redemption log (tracks discount codes generated)
CREATE TABLE public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.reward_transactions(id),
  points_spent integer NOT NULL,
  discount_code text NOT NULL,
  discount_amount numeric NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS: Users see own transactions
CREATE POLICY "Users can view own transactions" ON public.reward_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.reward_transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System inserts (for edge functions using service role)
CREATE POLICY "Service role can insert transactions" ON public.reward_transactions
  FOR INSERT TO service_role WITH CHECK (true);

-- RLS: Anyone can view tiers
CREATE POLICY "Anyone can view tiers" ON public.reward_tiers
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage tiers" ON public.reward_tiers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Users see own redemptions
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage redemptions" ON public.reward_redemptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert redemptions" ON public.reward_redemptions
  FOR INSERT TO service_role WITH CHECK (true);

-- Helper function: get user points balance
CREATE OR REPLACE FUNCTION public.get_user_points_balance(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::integer
  FROM public.reward_transactions
  WHERE user_id = p_user_id
$$;

-- Helper function: get user lifetime earned points
CREATE OR REPLACE FUNCTION public.get_user_lifetime_points(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::integer
  FROM public.reward_transactions
  WHERE user_id = p_user_id AND points > 0
$$;

-- Seed VIP tiers
INSERT INTO public.reward_tiers (name, icon, min_lifetime_spend, earn_rate, position, perks) VALUES
  ('Apprentice', '🩻', 0, 2, 0, ARRAY['2 Skulls per $1 spent', 'Birthday bonus']),
  ('Collector', '💀', 300, 2, 1, ARRAY['2 Skulls per $1 spent', 'Birthday bonus', 'Early access to drops']),
  ('Mentor', '☠️', 1000, 3, 2, ARRAY['3 Skulls per $1 spent', 'Birthday bonus', 'Early access', 'Free shipping']),
  ('Master', '👑', 3000, 3, 3, ARRAY['3 Skulls per $1 spent', 'Birthday bonus', 'Early access', 'Free shipping', 'Exclusive merch']);
