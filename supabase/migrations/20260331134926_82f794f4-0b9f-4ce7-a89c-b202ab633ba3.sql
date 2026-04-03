
CREATE OR REPLACE FUNCTION public.submit_survey_with_points(
  p_user_id uuid,
  p_answers jsonb,
  p_points integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user already submitted a survey
  IF EXISTS (
    SELECT 1 FROM public.customer_surveys WHERE user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Survey already submitted' USING ERRCODE = '23505';
  END IF;

  -- Insert survey
  INSERT INTO public.customer_surveys (user_id, answers, points_awarded)
  VALUES (p_user_id, p_answers, p_points);

  -- Award points (only if no survey points already exist)
  IF NOT EXISTS (
    SELECT 1 FROM public.reward_transactions
    WHERE user_id = p_user_id AND type = 'survey'
  ) THEN
    INSERT INTO public.reward_transactions (user_id, points, type, description)
    VALUES (p_user_id, p_points, 'survey', 'Earned ' || p_points || ' pts for completing customer survey');
  END IF;

  RETURN true;
END;
$$;
