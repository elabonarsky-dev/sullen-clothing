
-- Table to cache order tracking/fulfillment snapshots
CREATE TABLE public.order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  order_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  tracking_number text,
  tracking_url text,
  carrier text,
  estimated_delivery timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  last_shopify_sync timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Timeline events for granular tracking
CREATE TABLE public.order_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_tracking_id uuid REFERENCES public.order_tracking(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Public can read tracking via the edge function (security-definer pattern)
-- No direct public access to these tables
CREATE POLICY "Service role manages order tracking"
  ON public.order_tracking FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages tracking events"
  ON public.order_tracking_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_order_tracking_order_name_email ON public.order_tracking(order_name, email);
CREATE INDEX idx_tracking_events_tracking_id ON public.order_tracking_events(order_tracking_id);
