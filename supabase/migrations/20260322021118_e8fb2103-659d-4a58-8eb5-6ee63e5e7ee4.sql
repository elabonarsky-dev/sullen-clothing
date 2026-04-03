
ALTER TABLE public.issue_patterns
ADD COLUMN notified_at timestamptz DEFAULT NULL,
ADD COLUMN threshold_notified integer DEFAULT 0;
