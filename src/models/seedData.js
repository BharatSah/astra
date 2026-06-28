// Default data seeded into localStorage when the app runs in fallback/sandbox
// mode (no Supabase credentials configured). Mirrors the seed rows in the
// supabase migration so the offline experience matches the cloud one.
export const seedData = {
  services: [
    { id: '1', name: 'Domain Registration', description: 'Hosting domains like .com, .net, .np etc.', created_at: new Date().toISOString() },
    { id: '2', name: 'Web Hosting', description: 'Cloud and dedicated hosting servers', created_at: new Date().toISOString() },
    { id: '3', name: 'SSL Certificate', description: 'Secure Socket Layer certificate renewal', created_at: new Date().toISOString() },
    { id: '4', name: 'SaaS Subscription', description: 'Software as a service tools', created_at: new Date().toISOString() },
    { id: '5', name: 'SEO Services', description: 'Search engine optimization retainer', created_at: new Date().toISOString() }
  ],
  customers: [
    { id: 'c1', cname: 'Aiden Vance', domain_name: 'astra.com', email: 'aiden@example.com', phone: '+1-555-0199', service_id: '1', note: 'Domain astra.com primary setup', notify_before_days: 7, expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'warning', priority: 'high', auto_renewal: false, renewal_cost: 14.99, send_email_reminder: true, recipient_emails: 'aiden@example.com,admin@astra.com', created_at: new Date().toISOString() },
    { id: 'c2', cname: 'Zara Thorne', domain_name: 'thorne-hosting.net', email: 'zara@example.com', phone: '+1-555-0144', service_id: '2', note: 'Premium Node VPS server configuration', notify_before_days: 10, expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', priority: 'medium', auto_renewal: true, renewal_cost: 89.99, send_email_reminder: true, recipient_emails: 'zara@example.com', created_at: new Date().toISOString() },
    { id: 'c3', cname: 'Damon Hunt', domain_name: 'hunt-shop.com', email: 'damon@example.com', phone: '+1-555-0188', service_id: '3', note: 'E-commerce checkout SSL expired!', notify_before_days: 3, expiry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'expired', priority: 'low', auto_renewal: false, renewal_cost: 0, send_email_reminder: true, recipient_emails: 'damon@example.com,billing@hunt-shop.com', created_at: new Date().toISOString() }
  ],
  platforms: [
    { platform_name: 'GitHub', url: 'https://github.com', logo: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', created_at: new Date().toISOString() },
    { platform_name: 'Vercel Console', url: 'https://vercel.com', logo: 'https://cdn.svgporn.com/logos/vercel-icon.svg', created_at: new Date().toISOString() },
    { platform_name: 'Google Workspace', url: 'https://workspace.google.com', logo: 'https://cdn.svgporn.com/logos/google-icon.svg', created_at: new Date().toISOString() },
    { platform_name: 'AWS Management Console', url: 'https://aws.amazon.com', logo: 'https://cdn.svgporn.com/logos/aws.svg', created_at: new Date().toISOString() },
    { platform_name: 'Slack Workspace', url: 'https://slack.com', logo: 'https://cdn.svgporn.com/logos/slack-icon.svg', created_at: new Date().toISOString() }
  ],
  passwords: [
    { id: 'p1', platform_name: 'GitHub', username: 'project_astra_dev', password: 'AstraSecurePass2026!', created_at: new Date().toISOString() },
    { id: 'p2', platform_name: 'Vercel Console', username: 'admin@astra.com', password: 'VercelCloudSec#99', created_at: new Date().toISOString() }
  ],
  payment_reminders: [
    { id: 'r1', customer_name: 'Aiden Vance', service_id: '1', to_pay_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 49.99, currency: 'USD', status: 'pending', notify_days_before: 3, created_at: new Date().toISOString() },
    { id: 'r2', customer_name: 'Zara Thorne', service_id: '2', to_pay_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 25000.00, currency: 'NPR', status: 'overdue', notify_days_before: 5, created_at: new Date().toISOString() },
    { id: 'r3', customer_name: 'Damon Hunt', service_id: '3', to_pay_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 15.00, currency: 'USD', status: 'paid', notify_days_before: 2, created_at: new Date().toISOString() }
  ],
  system_settings: [
    {
      key: 'smtp_config',
      value: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        username: 'project.astra.notifications@gmail.com',
        password: 'xxxx xxxx xxxx xxxx',
        senderName: 'Astra Admin',
        senderEmail: 'project.astra.notifications@gmail.com'
      }
    },
    {
      key: 'email_templates',
      value: {
        expiry_warning: {
          subject: 'Warning: Your service {service_name} expires in {days} days',
          body: 'Dear {customer_name},\n\nThis is an automated reminder that your subscription for {service_name} is expiring on {expiry_date}.\n\nPlease renew it to avoid service interruption.\n\nBest regards,\nAstra'
        },
        expiry_expired: {
          subject: 'Critical: Your service {service_name} has expired',
          body: 'Dear {customer_name},\n\nThis is to inform you that your subscription for {service_name} expired on {expiry_date}.\n\nPlease renew it immediately to avoid deactivation.\n\nBest regards,\nAstra'
        },
        email_recipient: {
          to_email: 'admin@projectastra.com',
          warning_recipient_type: 'admin',
          expired_recipient_type: 'customer'
        },
        payment_reminder: {
          subject: 'Reminder: Payment due for {service_name}',
          body: 'Dear {customer_name},\n\nThis is a friendly reminder that a payment of {amount} {currency} is due on {due_date} for your {service_name} service.\n\nPlease process the payment before the due date.\n\nBest regards,\nAstra'
        }
      }
    }
  ],
  email_logs: []
};
