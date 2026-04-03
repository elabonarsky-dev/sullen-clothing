-- 1. Revoke EXECUTE on has_role from anon and public, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 2. Add email validation to return_requests INSERT policy
DROP POLICY IF EXISTS "Users can create returns" ON public.return_requests;
CREATE POLICY "Users can create returns" ON public.return_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.email() = order_email);

-- 3. Revoke EXECUTE on security-sensitive functions from anon/public
REVOKE EXECUTE ON FUNCTION public.grant_signup_bonus(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.grant_signup_bonus(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.atomic_redeem_points(uuid, integer, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.atomic_redeem_points(uuid, integer, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.verify_vault_code(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.verify_vault_code(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated, service_role;