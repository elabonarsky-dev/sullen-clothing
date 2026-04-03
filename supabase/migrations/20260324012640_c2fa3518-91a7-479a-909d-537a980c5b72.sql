
CREATE OR REPLACE FUNCTION public.claim_okendo_points(p_user_id uuid, p_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance integer;
  v_migration_id uuid;
BEGIN
  -- Find unclaimed migration record matching this email
  SELECT id, corrected_balance INTO v_migration_id, v_balance
  FROM public.okendo_migration
  WHERE LOWER(email) = LOWER(p_email)
    AND claimed = false
  FOR UPDATE;

  IF NOT FOUND OR v_balance <= 0 THEN
    RETURN 0;
  END IF;

  -- Credit the corrected points
  INSERT INTO public.reward_transactions (user_id, points, type, description, reference_id)
  VALUES (p_user_id, v_balance, 'okendo_import', 'Migrated loyalty points from previous program', v_migration_id::text);

  -- Mark as claimed
  UPDATE public.okendo_migration
  SET claimed = true, claimed_at = now(), claimed_by = p_user_id
  WHERE id = v_migration_id;

  RETURN v_balance;
END;
$$;
