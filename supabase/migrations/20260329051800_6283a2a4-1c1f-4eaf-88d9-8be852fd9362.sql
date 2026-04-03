CREATE OR REPLACE FUNCTION public.vault_reverse_cancelled_spend(p_email text, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.vault_members
  SET lifetime_spend = GREATEST(lifetime_spend - p_amount, 0),
      annual_spend = GREATEST(annual_spend - p_amount, 0),
      updated_at = now()
  WHERE LOWER(email) = LOWER(p_email);

  -- Re-assign tier after spend reversal
  PERFORM assign_vault_tier(id)
  FROM public.vault_members
  WHERE LOWER(email) = LOWER(p_email);
END;
$$;