
-- Remove overly permissive anon policies
DROP POLICY "Public can create returns" ON public.return_requests;
DROP POLICY "Public can create return items" ON public.return_items;

-- Allow service_role to insert (edge function will handle guest lookups)
CREATE POLICY "Service can manage returns" ON public.return_requests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can manage return items" ON public.return_items
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
