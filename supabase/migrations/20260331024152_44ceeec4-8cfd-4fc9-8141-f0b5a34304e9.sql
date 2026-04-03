-- Reset review request tokens that were marked 'sent' but have no matching email_send_log entry
-- These will be re-processed by the fixed function
UPDATE review_request_tokens
SET status = 'pending', sent_at = NULL, send_after = now()
WHERE status = 'sent'
AND sent_at > now() - interval '7 days'
AND NOT EXISTS (
  SELECT 1 FROM email_send_log e
  WHERE e.template_name = 'review-request'
  AND e.recipient_email = review_request_tokens.email
  AND e.status = 'sent'
  AND e.created_at > review_request_tokens.sent_at - interval '5 minutes'
);