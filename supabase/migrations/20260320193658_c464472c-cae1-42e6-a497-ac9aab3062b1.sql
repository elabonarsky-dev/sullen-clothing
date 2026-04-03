-- Add featured_type and featured_collection_handle settings
INSERT INTO public.site_settings (key, value)
VALUES ('featured_type', 'product'), ('featured_collection_handle', null)
ON CONFLICT (key) DO NOTHING;

-- Update RLS to allow reading the new keys publicly
DROP POLICY "Anyone can read safe site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read safe site_settings"
  ON public.site_settings FOR SELECT TO public
  USING (key = ANY (ARRAY[
    'featured_product_handle',
    'featured_type',
    'featured_collection_handle',
    'site_theme',
    'announcement_enabled',
    'maintenance_mode'
  ]));