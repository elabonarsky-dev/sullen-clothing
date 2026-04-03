CREATE TABLE public.drop_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  drop_handle text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drop_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up for drop notifications"
  ON public.drop_notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage drop notifications"
  ON public.drop_notifications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));