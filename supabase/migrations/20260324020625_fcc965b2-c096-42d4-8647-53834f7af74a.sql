
-- 1. Create vault_members table (extends existing auth-based system)
CREATE TABLE public.vault_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_customer_id text UNIQUE,
  email text,
  first_name text,
  last_name text,
  lifetime_spend numeric(10,2) DEFAULT 0,
  annual_spend numeric(10,2) DEFAULT 0,
  annual_spend_year integer DEFAULT extract(year FROM now()),
  current_tier text DEFAULT 'apprentice',
  tier_locked_until date,
  points_last_active date,
  points_frozen boolean DEFAULT false,
  welcome_bonus_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for lookups
CREATE UNIQUE INDEX idx_vault_members_user_id ON public.vault_members(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_vault_members_email ON public.vault_members(email);
CREATE INDEX idx_vault_members_tier ON public.vault_members(current_tier);

-- 2. Create vault_bonus_events table
CREATE TABLE public.vault_bonus_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger text NOT NULL,
  points_flat integer,
  points_multiplier numeric(3,1),
  min_tier text,
  active boolean DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- 3. Extend reward_tiers with new columns
ALTER TABLE public.reward_tiers 
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS annual_threshold numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_access_hours integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_shipping_minimum numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS color_hex text,
  ADD COLUMN IF NOT EXISTS pts_per_dollar numeric(4,2) DEFAULT 1.00;

-- 4. Add multiplier and source columns to reward_transactions
ALTER TABLE public.reward_transactions
  ADD COLUMN IF NOT EXISTS multiplier numeric(3,1) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS source text;

-- 5. RLS for vault_members
ALTER TABLE public.vault_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vault membership"
  ON public.vault_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage vault members"
  ON public.vault_members FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages vault members"
  ON public.vault_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. RLS for vault_bonus_events
ALTER TABLE public.vault_bonus_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bonus events"
  ON public.vault_bonus_events FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can manage bonus events"
  ON public.vault_bonus_events FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. Updated_at trigger for vault_members
CREATE TRIGGER update_vault_members_updated_at
  BEFORE UPDATE ON public.vault_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable realtime for vault_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_members;
