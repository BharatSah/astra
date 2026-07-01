-- Extend email_logs for dispatch metadata shown in the Email Logs UI.
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS email_type VARCHAR(100);
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
