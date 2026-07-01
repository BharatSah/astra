-- Track when an auto-expired email was last sent so we do not rely on browser storage.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_auto_expired_email_date DATE;
