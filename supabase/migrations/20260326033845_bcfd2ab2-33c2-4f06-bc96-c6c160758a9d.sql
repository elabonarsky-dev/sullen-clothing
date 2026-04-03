
-- Allow customer_service to SELECT on reward_transactions
CREATE POLICY "CS can view reward transactions"
ON public.reward_transactions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to SELECT on vault_members
CREATE POLICY "CS can view vault members"
ON public.vault_members FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to SELECT on reward_redemptions
CREATE POLICY "CS can view redemptions"
ON public.reward_redemptions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service full access to return_requests
CREATE POLICY "CS can manage returns"
ON public.return_requests FOR ALL TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role))
WITH CHECK (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service full access to return_items
CREATE POLICY "CS can manage return items"
ON public.return_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role))
WITH CHECK (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to view issue_logs
CREATE POLICY "CS can view issue logs"
ON public.issue_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to view issue_patterns
CREATE POLICY "CS can view issue patterns"
ON public.issue_patterns FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to view okendo_migration
CREATE POLICY "CS can view okendo migration"
ON public.okendo_migration FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to view reviews
CREATE POLICY "CS can view reviews"
ON public.reviews FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));

-- Allow customer_service to view back_in_stock_requests
CREATE POLICY "CS can view back in stock"
ON public.back_in_stock_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'customer_service'::app_role));
