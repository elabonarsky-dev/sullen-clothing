
-- Hybrid tier assignment: max(lifetime_floor_tier, annual_spend_tier)
CREATE OR REPLACE FUNCTION public.assign_vault_tier(p_member_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member record;
  v_floor_tier text;
  v_floor_order integer;
  v_perk_tier text;
  v_perk_order integer;
  v_final_tier text;
  v_final_order integer;
  v_old_tier text;
BEGIN
  SELECT lifetime_spend, annual_spend, current_tier
  INTO v_member
  FROM public.vault_members
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found: %', p_member_id;
  END IF;

  v_old_tier := v_member.current_tier;

  -- Determine floor tier from lifetime spend
  SELECT slug, position INTO v_floor_tier, v_floor_order
  FROM public.reward_tiers
  WHERE min_lifetime_spend <= v_member.lifetime_spend
  ORDER BY position DESC
  LIMIT 1;

  -- Determine perk tier from annual spend
  SELECT slug, position INTO v_perk_tier, v_perk_order
  FROM public.reward_tiers
  WHERE annual_threshold <= v_member.annual_spend
  ORDER BY position DESC
  LIMIT 1;

  -- Final tier = higher of the two
  IF v_floor_order >= v_perk_order THEN
    v_final_tier := v_floor_tier;
    v_final_order := v_floor_order;
  ELSE
    v_final_tier := v_perk_tier;
    v_final_order := v_perk_order;
  END IF;

  -- Update member
  UPDATE public.vault_members
  SET current_tier = v_final_tier, updated_at = now()
  WHERE id = p_member_id;

  -- Log tier change if different
  IF v_old_tier IS DISTINCT FROM v_final_tier THEN
    INSERT INTO public.reward_transactions (user_id, points, type, description, source)
    SELECT vm.user_id, 0, 'admin_adjustment',
           'Tier changed: ' || COALESCE(v_old_tier, 'none') || ' → ' || v_final_tier,
           'tier_assignment'
    FROM public.vault_members vm
    WHERE vm.id = p_member_id AND vm.user_id IS NOT NULL;
  END IF;

  RETURN v_final_tier;
END;
$$;

-- Annual reset function (to be called Jan 1 via cron or manual trigger)
CREATE OR REPLACE FUNCTION public.vault_annual_reset()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_member record;
  v_new_tier text;
BEGIN
  FOR v_member IN
    SELECT id, current_tier FROM public.vault_members
  LOOP
    -- Reset annual spend
    UPDATE public.vault_members
    SET annual_spend = 0,
        annual_spend_year = extract(year FROM now()),
        updated_at = now()
    WHERE id = v_member.id;

    -- Re-assign tier
    v_new_tier := assign_vault_tier(v_member.id);

    -- If tier dropped, set 30-day grace period
    IF v_new_tier IS DISTINCT FROM v_member.current_tier THEN
      UPDATE public.vault_members
      SET tier_locked_until = (date_trunc('year', now()) + interval '30 days')::date
      WHERE id = v_member.id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Points earn calculation function
CREATE OR REPLACE FUNCTION public.vault_earn_points(
  p_member_id uuid,
  p_order_total numeric,
  p_source_reference text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member record;
  v_tier record;
  v_base_pts numeric;
  v_multiplier numeric;
  v_bonus_multiplier numeric := 1.0;
  v_final_pts integer;
BEGIN
  -- Get member and their tier
  SELECT vm.*, rt.pts_per_dollar, rt.earn_rate AS tier_multiplier
  INTO v_member
  FROM public.vault_members vm
  JOIN public.reward_tiers rt ON rt.slug = vm.current_tier
  WHERE vm.id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found: %', p_member_id;
  END IF;

  -- Check for active bonus multiplier events
  SELECT COALESCE(MAX(points_multiplier), 1.0) INTO v_bonus_multiplier
  FROM public.vault_bonus_events
  WHERE active = true
    AND points_multiplier IS NOT NULL
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND (min_tier IS NULL OR min_tier = v_member.current_tier);

  -- Calculate points
  v_base_pts := p_order_total * v_member.pts_per_dollar;
  v_multiplier := v_member.tier_multiplier * v_bonus_multiplier;
  v_final_pts := ROUND(v_base_pts * v_multiplier);

  -- Insert transaction (linked to user_id if available)
  IF v_member.user_id IS NOT NULL THEN
    INSERT INTO public.reward_transactions (user_id, points, type, description, reference_id, multiplier, source)
    VALUES (v_member.user_id, v_final_pts, 'purchase',
            'Earned ' || v_final_pts || ' pts on $' || ROUND(p_order_total, 2) || ' order (' || v_multiplier || 'x)',
            p_source_reference, v_multiplier, 'order');
  END IF;

  -- Update member spend and activity
  UPDATE public.vault_members
  SET lifetime_spend = lifetime_spend + p_order_total,
      annual_spend = annual_spend + p_order_total,
      points_last_active = CURRENT_DATE,
      points_frozen = false,
      updated_at = now()
  WHERE id = p_member_id;

  -- Re-assign tier after spend update
  PERFORM assign_vault_tier(p_member_id);

  RETURN v_final_pts;
END;
$$;
