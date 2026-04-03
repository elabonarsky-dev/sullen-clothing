
-- Create a security-definer function to verify vault codes without exposing the table
CREATE OR REPLACE FUNCTION public.verify_vault_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record record;
BEGIN
  SELECT id, max_uses, current_uses, valid_until
  INTO v_record
  FROM public.vault_access_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_code');
  END IF;

  IF v_record.valid_until IS NOT NULL AND v_record.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  IF v_record.max_uses IS NOT NULL AND v_record.current_uses >= v_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'usage_limit');
  END IF;

  -- Increment usage counter
  UPDATE public.vault_access_codes
  SET current_uses = current_uses + 1
  WHERE id = v_record.id;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can verify codes" ON public.vault_access_codes;
