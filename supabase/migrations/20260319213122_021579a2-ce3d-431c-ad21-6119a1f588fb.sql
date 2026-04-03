ALTER TABLE public.return_requests
  ADD COLUMN fraud_score integer NOT NULL DEFAULT 0,
  ADD COLUMN fraud_flags text[] NOT NULL DEFAULT '{}'::text[];