-- Supabase Schema for Project Astra
-- To run this, copy the SQL below and execute it in your Supabase SQL Editor.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers & Expiry Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    note TEXT,
    notify_before_days INTEGER DEFAULT 7,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'warning', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Password Management Table
CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(255) NOT NULL,
    platform_url VARCHAR(500),
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payment Reminders Table
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    to_pay_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' CHECK (currency IN ('USD', 'NPR')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
    notify_days_before INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Email Logs Table (for SMTP configuration history / queuing)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- 6. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Services
INSERT INTO services (name, description) VALUES
('Domain Registration', 'Hosting domains like .com, .net, .np etc.'),
('Web Hosting', 'Cloud and dedicated hosting servers'),
('SSL Certificate', 'Secure Socket Layer certificate renewal'),
('SaaS Subscription', 'Software as a service tools'),
('SEO Services', 'Search engine optimization retainer')
ON CONFLICT (name) DO NOTHING;

-- Insert Default Settings
INSERT INTO system_settings (key, value) VALUES
('smtp_config', '{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "username": "",
  "password": "",
  "senderName": "Astra Notifications",
  "senderEmail": ""
}'::jsonb),
('email_templates', '{
  "expiry_warning": {
    "subject": "Warning: Your service {service_name} expires in {days} days",
    "body": "Dear {customer_name},\n\nThis is an automated reminder that your subscription for {service_name} is expiring on {expiry_date}.\n\nPlease renew it to avoid service interruption.\n\nBest regards,\nProject Astra"
  },
  "payment_reminder": {
    "subject": "Reminder: Payment due for {service_name}",
    "body": "Dear {customer_name},\n\nThis is a friendly reminder that a payment of {amount} {currency} is due on {due_date} for your {service_name} service.\n\nPlease process the payment before the due date.\n\nBest regards,\nProject Astra"
  }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_customers_expiry ON customers(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_date ON payment_reminders(to_pay_date);
