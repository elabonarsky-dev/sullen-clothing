
-- Auto-grant signup bonus: insert 50 points on new user creation
-- Using a function + trigger approach on auth is not allowed, so we'll handle this in-app
-- Instead, create a function that can be called to grant signup bonus safely
CREATE OR REPLACE FUNCTION public.grant_signup_bonus(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only grant if no signup bonus exists
  IF NOT EXISTS (
    SELECT 1 FROM public.reward_transactions
    WHERE user_id = p_user_id AND type = 'signup_bonus'
  ) THEN
    INSERT INTO public.reward_transactions (user_id, points, type, description)
    VALUES (p_user_id, 50, 'signup_bonus', 'Welcome bonus for joining the Sullen Family');
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
