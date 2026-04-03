-- Restrict site_settings public read to only safe keys
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read safe site_settings" ON public.site_settings
  FOR SELECT TO public
  USING (key = ANY(ARRAY[
    'featured_product_handle',
    'site_theme',
    'announcement_enabled',
    'maintenance_mode'
  ]));