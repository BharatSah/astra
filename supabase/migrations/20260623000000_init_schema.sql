-- Initial Schema Migration for Project Astra

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean wipe existing tables to reapply structural links
DROP TABLE IF EXISTS passwords CASCADE;
DROP TABLE IF EXISTS platforms CASCADE;
DROP TABLE IF EXISTS payment_reminders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- 1. Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers & Expiry Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cname VARCHAR(255) NOT NULL,
    domain_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    note TEXT,
    notify_before_days INTEGER DEFAULT 7,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'warning', 'expired')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    auto_renewal BOOLEAN DEFAULT FALSE,
    renewal_cost NUMERIC(12, 2) DEFAULT 0.00,
    send_email_reminder BOOLEAN DEFAULT TRUE,
    recipient_emails TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Platforms Table (Primary Key: platform_name)
CREATE TABLE platforms (
    platform_name VARCHAR(255) PRIMARY KEY,
    url VARCHAR(500),
    logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Password Management Table (platform_name references platforms.platform_name)
CREATE TABLE passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(255) NOT NULL REFERENCES platforms(platform_name) ON UPDATE CASCADE ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payment Reminders Table
CREATE TABLE payment_reminders (
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

-- 6. Email Logs Table (for SMTP configuration history / queuing)
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- 7. System Settings Table
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Services
INSERT INTO services (name, description) VALUES
('Domain', 'Domain registration and renewal management'),
('Hosting', 'Web and database cloud hosting environments'),
('VPS', 'Virtual Private Servers configuration'),
('SSL', 'Secure Socket Layer renewals'),
('Email Hosting', 'Enterprise email setup and inbox systems'),
('Website Maintenance', 'Core codebase updates, security audits and retainers'),
('Software License', 'Subscribed key codes and service plans'),
('Other', 'Custom contracts and unlisted service options')
ON CONFLICT (name) DO NOTHING;

-- Insert Default Platforms
INSERT INTO platforms (platform_name, url, logo) VALUES
('GitHub', 'https://github.com', 'https://cdn-icons-png.flaticon.com/512/25/25231.png'),
('Vercel Console', 'https://vercel.com', 'https://cdn.svgporn.com/logos/vercel-icon.svg'),
('Google Workspace', 'https://workspace.google.com', 'https://cdn.svgporn.com/logos/google-icon.svg'),
('AWS Management Console', 'https://aws.amazon.com', 'https://cdn.svgporn.com/logos/aws.svg'),
('Slack Workspace', 'https://slack.com', 'https://cdn.svgporn.com/logos/slack-icon.svg')
ON CONFLICT (platform_name) DO NOTHING;

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
  "expiry_expired": {
    "subject": "Critical: Your service {service_name} has expired",
    "body": "Dear {customer_name},\n\nThis is to inform you that your subscription for {service_name} expired on {expiry_date}.\n\nPlease renew it immediately to avoid deactivation.\n\nBest regards,\nProject Astra"
  },
  "email_recipient": {
    "to_email": "",
    "warning_recipient_type": "admin",
    "expired_recipient_type": "customer"
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
