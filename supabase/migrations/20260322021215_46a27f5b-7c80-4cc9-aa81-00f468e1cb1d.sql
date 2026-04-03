
-- Allow public read of issue alert settings
DROP POLICY IF EXISTS "Anyone can read safe site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read safe site_settings" ON public.site_settings
  FOR SELECT TO public
  USING (key = ANY (ARRAY[
    'featured_product_handle',
    'featured_type',
    'featured_collection_handle',
    'site_theme',
    'announcement_enabled',
    'maintenance_mode',
    'issue_alert_webhook_url',
    'issue_alert_email',
    'issue_alert_threshold'
  ]));
