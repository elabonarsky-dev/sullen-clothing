
-- Unboxing campaigns: admin-managed, toggled for special drops
CREATE TABLE public.unboxing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  reward_type text NOT NULL DEFAULT 'points', -- 'points' or 'discount'
  reward_points_min integer DEFAULT 50,
  reward_points_max integer DEFAULT 200,
  reward_discount_amount numeric DEFAULT NULL,
  reward_discount_codes text[] DEFAULT '{}',
  cover_image_url text DEFAULT NULL,
  description text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unboxing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage unboxing campaigns"
  ON public.unboxing_campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active unboxing campaigns"
  ON public.unboxing_campaigns FOR SELECT TO public
  USING (is_active = true);

-- Claims: tracks who revealed what (prevents double claims)
CREATE TABLE public.unboxing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.unboxing_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id text DEFAULT NULL,
  reward_type text NOT NULL,
  reward_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

ALTER TABLE public.unboxing_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON public.unboxing_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages claims"
  ON public.unboxing_claims FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view all claims"
  ON public.unboxing_claims FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
