
-- Fix 1: Remove permissive INSERT policy that allows unlimited birthday/survey points farming
DROP POLICY IF EXISTS "Users can insert own survey and birthday transactions" ON public.reward_transactions;

-- Fix 2: Remove vault_members and reward_transactions from Realtime publication to prevent PII broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.vault_members;
ALTER PUBLICATION supabase_realtime DROP TABLE public.reward_transactions;

-- Fix 3: Update reviews INSERT policy to force verified_purchase = false
DROP POLICY IF EXISTS "Users can submit reviews" ON public.reviews;
CREATE POLICY "Users can submit reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND verified_purchase = false);
