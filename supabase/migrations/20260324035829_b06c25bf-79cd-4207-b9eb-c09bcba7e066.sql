ALTER TABLE public.issue_logs
  ADD COLUMN customer_email text DEFAULT NULL,
  ADD COLUMN order_number text DEFAULT NULL;

CREATE INDEX idx_issue_logs_order_number ON public.issue_logs(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX idx_issue_logs_customer_email ON public.issue_logs(customer_email) WHERE customer_email IS NOT NULL;