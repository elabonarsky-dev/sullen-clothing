
-- Return request statuses
CREATE TYPE public.return_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'shipped',
  'received',
  'completed',
  'cancelled'
);

CREATE TYPE public.return_resolution AS ENUM (
  'exchange',
  'store_credit',
  'refund'
);

-- Main return requests table
CREATE TABLE public.return_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  order_name TEXT NOT NULL,
  order_email TEXT NOT NULL,
  status public.return_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual items within a return
CREATE TABLE public.return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  line_item_title TEXT NOT NULL,
  line_item_variant TEXT,
  line_item_image TEXT,
  line_item_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  resolution public.return_resolution NOT NULL DEFAULT 'exchange',
  exchange_product_handle TEXT,
  exchange_variant_id TEXT,
  exchange_variant_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view own returns
CREATE POLICY "Users can view own returns" ON public.return_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Users can insert own returns
CREATE POLICY "Users can create returns" ON public.return_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Admins can manage all returns
CREATE POLICY "Admins can manage returns" ON public.return_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Anyone can view return items if they can view the parent request
CREATE POLICY "Users can view own return items" ON public.return_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.return_requests rr
    WHERE rr.id = return_request_id AND rr.user_id = auth.uid()
  ));

CREATE POLICY "Users can create return items" ON public.return_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.return_requests rr
    WHERE rr.id = return_request_id AND rr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage return items" ON public.return_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Public can insert returns (for guest order lookup)
CREATE POLICY "Public can create returns" ON public.return_requests
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can create return items" ON public.return_items
  FOR INSERT TO anon
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
