INSERT INTO public.cart_incentives (label, type, threshold, icon, description, position, is_active)
VALUES ('Free Gift', 'gift', 99, '🎁', 'Free gift added to your cart automatically', 1, true)
ON CONFLICT DO NOTHING;