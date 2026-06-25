-- Migration to enable Row-Level Security (RLS) with authenticated/admin policies.
--
-- SECURITY: The prior version of this file enabled RLS but then created
-- `TO public USING (true) WITH CHECK (true)` policies on every table. That is
-- equivalent to no RLS at all: anyone with the anon key (shipped in the client
-- bundle) could read AND modify every row, including the `passwords` and
-- `system_settings` tables. This migration replaces those open policies with
-- admin-only defaults. Set an admin user's app_metadata to either
-- {"role":"admin"} or {"roles":["admin"]}. Do not use user_metadata for
-- authorization; users can edit it themselves through the Auth API.

-- Drop the previous open-to-public policies if they exist.
DROP POLICY IF EXISTS "Allow public access to services" ON services;
DROP POLICY IF EXISTS "Allow public access to customers" ON customers;
DROP POLICY IF EXISTS "Allow public access to platforms" ON platforms;
DROP POLICY IF EXISTS "Allow public access to passwords" ON passwords;
DROP POLICY IF EXISTS "Allow public access to payment_reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Allow public access to email_logs" ON email_logs;
DROP POLICY IF EXISTS "Allow public access to system_settings" ON system_settings;
DROP POLICY IF EXISTS "Authenticated read on services" ON services;
DROP POLICY IF EXISTS "Authenticated read on customers" ON customers;
DROP POLICY IF EXISTS "Authenticated read on platforms" ON platforms;
DROP POLICY IF EXISTS "Authenticated read on passwords" ON passwords;
DROP POLICY IF EXISTS "Authenticated read on payment_reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Authenticated read on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Authenticated read on system_settings" ON system_settings;
DROP POLICY IF EXISTS "Admin write on services" ON services;
DROP POLICY IF EXISTS "Admin write on customers" ON customers;
DROP POLICY IF EXISTS "Admin write on platforms" ON platforms;
DROP POLICY IF EXISTS "Admin write on passwords" ON passwords;
DROP POLICY IF EXISTS "Admin write on payment_reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Admin write on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admin write on system_settings" ON system_settings;
DROP POLICY IF EXISTS "Admin access on services" ON services;
DROP POLICY IF EXISTS "Admin access on customers" ON customers;
DROP POLICY IF EXISTS "Admin access on platforms" ON platforms;
DROP POLICY IF EXISTS "Admin access on passwords" ON passwords;
DROP POLICY IF EXISTS "Admin access on payment_reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Admin access on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admin access on system_settings" ON system_settings;

-- Enable Row Level Security (RLS).
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin helper backed by JWT app_metadata.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
      OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false);
$$;

-- Admin-only read/write access.
CREATE POLICY "Admin access on services" ON services FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY "Admin access on customers" ON customers FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY "Admin access on platforms" ON platforms FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY "Admin access on passwords" ON passwords FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY "Admin access on payment_reminders" ON payment_reminders FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY "Admin access on email_logs" ON email_logs FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
CREATE POLICY "Admin access on system_settings" ON system_settings FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
