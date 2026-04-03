-- Add unique constraint on user_id for vault_members to support ON CONFLICT
ALTER TABLE public.vault_members ADD CONSTRAINT vault_members_user_id_unique UNIQUE (user_id);

-- Create idempotent function to ensure vault member exists
CREATE OR REPLACE FUNCTION public.ensure_vault_member(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.vault_members (user_id, email, current_tier, lifetime_spend, annual_spend)
  VALUES (p_user_id, p_email, 'apprentice', 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;