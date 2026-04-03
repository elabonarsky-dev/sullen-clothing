
-- Add columns to track Shopify return ID and return label URL
ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS shopify_return_id text,
  ADD COLUMN IF NOT EXISTS return_label_url text;
