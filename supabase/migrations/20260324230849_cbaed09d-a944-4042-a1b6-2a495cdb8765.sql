-- Create a helper function to check if user has any of the allowed roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- Update artist_profiles RLS: allow artist_manager to manage too
DROP POLICY IF EXISTS "Admins can manage artist profiles" ON public.artist_profiles;
CREATE POLICY "Admins and managers can manage artist profiles"
ON public.artist_profiles
FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin', 'artist_manager']::app_role[]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'artist_manager']::app_role[]));