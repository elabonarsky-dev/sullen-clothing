-- Add unique index on user_id so ON CONFLICT works reliably
CREATE UNIQUE INDEX IF NOT EXISTS vault_members_user_id_unique ON public.vault_members (user_id) WHERE user_id IS NOT NULL;

-- Recreate function with better error handling and email upsert
CREATE OR REPLACE FUNCTION public.ensure_vault_member(p_user_id uuid, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Try insert first; if user_id already exists, update email if it was null
  INSERT INTO public.vault_members (user_id, email, current_tier, lifetime_spend, annual_spend, annual_spend_year)
  VALUES (p_user_id, LOWER(p_email), 'apprentice', 0, 0, EXTRACT(YEAR FROM now())::int)
  ON CONFLICT (user_id) DO UPDATE
    SET email = COALESCE(vault_members.email, EXCLUDED.email),
        updated_at = now();

  -- Also link any pre-existing row matched by email (e.g. from Shopify import) that has no user_id
  UPDATE public.vault_members
  SET user_id = p_user_id, updated_at = now()
  WHERE LOWER(email) = LOWER(p_email)
    AND user_id IS NULL;
END;
$$;