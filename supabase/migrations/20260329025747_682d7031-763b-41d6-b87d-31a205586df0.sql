-- Fix 1: Add user-scoped SELECT policy on order_tracking
CREATE POLICY "Users can view own tracking"
  ON public.order_tracking
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.email()));

-- Fix 2: Add user-scoped SELECT policy on order_tracking_events
CREATE POLICY "Users can view own tracking events"
  ON public.order_tracking_events
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.order_tracking ot
    WHERE ot.id = order_tracking_events.order_tracking_id
      AND lower(ot.email) = lower(auth.email())
  ));

-- Fix 3: Set search_path on remaining mutable functions
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid, n.nspname, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM pg_options_to_table(p.proconfig)
        WHERE option_name = 'search_path'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
      fn.nspname, fn.proname,
      pg_get_function_identity_arguments(fn.oid));
  END LOOP;
END $$;