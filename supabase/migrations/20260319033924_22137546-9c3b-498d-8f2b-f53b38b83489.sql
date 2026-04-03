
-- Prevent birthday from being changed once set
CREATE OR REPLACE FUNCTION public.prevent_birthday_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.birthday IS NOT NULL AND NEW.birthday IS DISTINCT FROM OLD.birthday THEN
    RAISE EXCEPTION 'Birthday cannot be changed once set';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_birthday_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_birthday_change();
