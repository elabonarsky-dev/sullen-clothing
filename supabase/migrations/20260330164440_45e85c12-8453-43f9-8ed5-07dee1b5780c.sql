
-- Fix 1: Allow authenticated users to insert their own survey/birthday reward transactions
CREATE POLICY "Users can insert own survey and birthday transactions"
  ON public.reward_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type IN ('survey'::reward_transaction_type, 'birthday'::reward_transaction_type, 'birthday_multiplier'::reward_transaction_type)
  );

-- Fix 2: Allow authenticated users to insert their own vault membership (ensure_vault_member runs as SECURITY DEFINER but client-side calls may also need this)
-- Actually ensure_vault_member is SECURITY DEFINER so it bypasses RLS. The issue might be elsewhere.
-- Let's also ensure the customer_surveys insert works - check if there's a unique constraint causing silent failures
