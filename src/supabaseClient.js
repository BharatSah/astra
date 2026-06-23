import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid-looking Supabase credentials, but bypass during testing
const isTestMode = typeof window !== 'undefined' && window.location.search.includes('test=true');
const hasSupabase = !isTestMode && 
                    supabaseUrl && 
                    supabaseUrl !== 'YOUR_SUPABASE_URL' && 
                    supabaseAnonKey && 
                    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Default initial data for localStorage fallback
const DEFAULT_LOCAL_DATA = {
  services: [
    { id: '1', name: 'Domain Registration', description: 'Hosting domains like .com, .net, .np etc.', created_at: new Date().toISOString() },
    { id: '2', name: 'Web Hosting', description: 'Cloud and dedicated hosting servers', created_at: new Date().toISOString() },
    { id: '3', name: 'SSL Certificate', description: 'Secure Socket Layer certificate renewal', created_at: new Date().toISOString() },
    { id: '4', name: 'SaaS Subscription', description: 'Software as a service tools', created_at: new Date().toISOString() },
    { id: '5', name: 'SEO Services', description: 'Search engine optimization retainer', created_at: new Date().toISOString() }
  ],
  customers: [
    { id: 'c1', cname: 'Aiden Vance', email: 'aiden@example.com', phone: '+1-555-0199', service_id: '1', note: 'Domain astra.com primary setup', notify_before_days: 7, expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'warning', created_at: new Date().toISOString() },
    { id: 'c2', cname: 'Zara Thorne', email: 'zara@example.com', phone: '+1-555-0144', service_id: '2', note: 'Premium Node VPS server configuration', notify_before_days: 10, expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', created_at: new Date().toISOString() },
    { id: 'c3', cname: 'Damon Hunt', email: 'damon@example.com', phone: '+1-555-0188', service_id: '3', note: 'E-commerce checkout SSL expired!', notify_before_days: 3, expiry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'expired', created_at: new Date().toISOString() }
  ],
  passwords: [
    { id: 'p1', platform_name: 'GitHub', platform_url: 'https://github.com', username: 'project_astra_dev', password: 'AstraSecurePass2026!', created_at: new Date().toISOString() },
    { id: 'p2', platform_name: 'Vercel Console', platform_url: 'https://vercel.com', username: 'admin@astra.com', password: 'VercelCloudSec#99', created_at: new Date().toISOString() }
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
        senderName: 'Project Astra Admin',
        senderEmail: 'project.astra.notifications@gmail.com'
      }
    },
    {
      key: 'email_templates',
      value: {
        expiry_warning: {
          subject: 'Warning: Your service {service_name} expires in {days} days',
          body: 'Dear {customer_name},\n\nThis is an automated reminder that your subscription for {service_name} is expiring on {expiry_date}.\n\nPlease renew it to avoid service interruption.\n\nBest regards,\nProject Astra'
        },
        email_recipient: {
          to_email: 'admin@projectastra.com'
        },
        payment_reminder: {
          subject: 'Reminder: Payment due for {service_name}',
          body: 'Dear {customer_name},\n\nThis is a friendly reminder that a payment of {amount} {currency} is due on {due_date} for your {service_name} service.\n\nPlease process the payment before the due date.\n\nBest regards,\nProject Astra'
        }
      }
    }
  ],
  email_logs: []
};

// LocalStorage Helper functions
const getLocalDB = () => {
  const data = localStorage.getItem('astra_db');
  if (!data) {
    localStorage.setItem('astra_db', JSON.stringify(DEFAULT_LOCAL_DATA));
    return DEFAULT_LOCAL_DATA;
  }
  try {
    return JSON.parse(data);
  } catch {
    localStorage.setItem('astra_db', JSON.stringify(DEFAULT_LOCAL_DATA));
    return DEFAULT_LOCAL_DATA;
  }
};

const setLocalDB = (db) => {
  localStorage.setItem('astra_db', JSON.stringify(db));
};

// Fluent Interface Mock Builder
class MockSupabaseQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = getLocalDB();
    this.data = [...(this.db[tableName] || [])];
    this.error = null;
  }

  select() {
    // Basic select, returns this for chaining
    return this;
  }

  insert(values) {
    const valueArray = Array.isArray(values) ? values : [values];
    const newItems = valueArray.map(item => ({
      id: item.id || Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      ...item
    }));

    this.db[this.tableName] = [...(this.db[this.tableName] || []), ...newItems];
    setLocalDB(this.db);
    this.data = newItems; // insert returns the newly created items
    return this;
  }

  update(values) {
    this.updateValues = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  upsert(values) {
    const valueArray = Array.isArray(values) ? values : [values];
    valueArray.forEach(item => {
      const idx = this.db[this.tableName].findIndex(x => x.key === item.key || x.id === item.id);
      if (idx > -1) {
        this.db[this.tableName][idx] = { ...this.db[this.tableName][idx], ...item, updated_at: new Date().toISOString() };
      } else {
        this.db[this.tableName].push({
          id: item.id || Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          ...item
        });
      }
    });
    setLocalDB(this.db);
    this.data = valueArray;
    return this;
  }

  eq(column, value) {
    if (this.updateValues) {
      this.db[this.tableName] = this.db[this.tableName].map(item => {
        if (item[column] === value) {
          return { ...item, ...this.updateValues };
        }
        return item;
      });
      setLocalDB(this.db);
      this.data = this.db[this.tableName].filter(item => item[column] === value);
    } else if (this.isDelete) {
      this.db[this.tableName] = this.db[this.tableName].filter(item => item[column] !== value);
      setLocalDB(this.db);
      this.data = [];
    } else {
      this.data = this.data.filter(item => item[column] === value);
    }
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.data.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  // To simulate Promise resolve (async/await)
  then(onfulfilled) {
    const response = {
      data: this.data,
      error: this.error
    };
    return Promise.resolve(onfulfilled(response));
  }
}

// Mock Client
const mockSupabase = {
  from(tableName) {
    return new MockSupabaseQueryBuilder(tableName);
  },
  isFallback: true
};

// Export active client and status
export const supabase = hasSupabase ? createClient(supabaseUrl, supabaseAnonKey) : mockSupabase;
export const isFallbackMode = !hasSupabase;
export const getSupabaseConfig = () => ({
  hasSupabase,
  supabaseUrl,
  supabaseAnonKey
});
