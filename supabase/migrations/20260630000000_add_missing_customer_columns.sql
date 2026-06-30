-- Add columns missing from the live customers table that the app code expects.
-- These are defined in the init migration but were absent from the live DB,
-- causing "Could not find the 'recipient_emails' column" errors on insert.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS domain_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS recipient_emails TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS renewal_cost NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS send_email_reminder BOOLEAN DEFAULT TRUE;