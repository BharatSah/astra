-- Allow any signed-in user to access app tables. Anon (unauthenticated) remains
-- blocked because there are no policies for the anon role.
--
-- The prior admin-only policies required app_metadata.role = 'admin', but the app
-- does not set that on login, so authenticated users saw empty tables and inserts
-- (including email_logs) failed with RLS violations.

DROP POLICY IF EXISTS "Admin access on services" ON services;
DROP POLICY IF EXISTS "Admin access on customers" ON customers;
DROP POLICY IF EXISTS "Admin access on platforms" ON platforms;
DROP POLICY IF EXISTS "Admin access on passwords" ON passwords;
DROP POLICY IF EXISTS "Admin access on payment_reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Admin access on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admin access on system_settings" ON system_settings;

CREATE POLICY "Authenticated access on services"
  ON services FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access on customers"
  ON customers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access on platforms"
  ON platforms FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access on passwords"
  ON passwords FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access on payment_reminders"
  ON payment_reminders FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access on email_logs"
  ON email_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access on system_settings"
  ON system_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
