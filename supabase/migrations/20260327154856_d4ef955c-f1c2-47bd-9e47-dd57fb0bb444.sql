
-- Role audit log table
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL, -- 'assigned', 'revoked', 'pre_invited', 'invite_deleted'
  target_email text,
  target_user_id text,
  role text NOT NULL,
  performed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit log"
  ON public.role_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert (the app controls who inserts)
CREATE POLICY "Authenticated users can insert audit log"
  ON public.role_audit_log FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid());
