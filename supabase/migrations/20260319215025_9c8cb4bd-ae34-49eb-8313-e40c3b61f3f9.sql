
CREATE OR REPLACE FUNCTION public.atomic_redeem_points(
  p_user_id uuid,
  p_points integer,
  p_description text,
  p_reference_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance integer;
  v_tx_id uuid;
BEGIN
  -- Lock all rows for this user to prevent concurrent redemptions
  PERFORM 1 FROM public.reward_transactions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calculate balance atomically
  SELECT COALESCE(SUM(points), 0) INTO v_balance
  FROM public.reward_transactions
  WHERE user_id = p_user_id;

  IF v_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points: have %, need %', v_balance, p_points;
  END IF;

  -- Deduct points
  INSERT INTO public.reward_transactions (user_id, points, type, description, reference_id)
  VALUES (p_user_id, -p_points, 'redemption', p_description, p_reference_id)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;
