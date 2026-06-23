import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Mail, RefreshCw, Save } from 'lucide-react';

export default function SmtpConfig({ onNotify }) {
  // SMTP Settings state
  const [smtp, setSmtp] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    senderName: 'Astra Notifications',
    senderEmail: ''
  });

  const [templates, setTemplates] = useState({
    expiry_warning: { subject: '', body: '' },
    expiry_expired: { subject: '', body: '' },
    email_recipient: { to_email: '', warning_recipient_type: 'admin', expired_recipient_type: 'customer' },
    payment_reminder: { subject: '', body: '' }
  });

  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);

  useEffect(() => {
    fetchSystemSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*');
      if (error) throw error;
      
      if (data) {
        const smtpData = data.find(item => item.key === 'smtp_config');
        if (smtpData) setSmtp(smtpData.value);

        const templateData = data.find(item => item.key === 'email_templates');
        if (templateData) setTemplates(templateData.value);
      }
    } catch (err) {
      console.error('Error fetching system settings:', err.message);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({
        key: 'smtp_config',
        value: smtp
      });
      if (error) throw error;
      onNotify('success', 'SMTP settings saved successfully');
    } catch (err) {
      console.error('Error saving SMTP settings:', err.message);
      onNotify('error', 'Failed to save SMTP settings');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSaveTemplates = async (e) => {
    e.preventDefault();
    setSavingTemplates(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({
        key: 'email_templates',
        value: templates
      });
      if (error) throw error;
      onNotify('success', 'Email templates saved successfully');
    } catch (err) {
      console.error('Error saving templates:', err.message);
      onNotify('error', 'Failed to save templates');
    } finally {
      setSavingTemplates(false);
    }
  };

  return (
    <div className="animate-slide-up flex flex-col h-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
            Email & SMTP Config
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full max-w-5xl overflow-y-auto pb-8">
        {/* SMTP Credentials */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-850">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            Gmail SMTP Configuration
          </h2>
          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">SMTP Host</label>
                <input
                  type="text"
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Port</label>
                <input
                  type="number"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Gmail Username (Email)</label>
              <input
                type="email"
                placeholder="your-email@gmail.com"
                value={smtp.username}
                onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Gmail App Password</label>
                <span className="text-[10px] text-brand-400 font-medium">Use a 16-character Google App Password</span>
              </div>
              <input
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                value={smtp.password}
                onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sender Display Name</label>
                <input
                  type="text"
                  value={smtp.senderName}
                  onChange={(e) => setSmtp({ ...smtp, senderName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sender Reply-To Email</label>
                <input
                  type="email"
                  placeholder="reply-to@gmail.com"
                  value={smtp.senderEmail || smtp.username}
                  onChange={(e) => setSmtp({ ...smtp, senderEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSmtp}
              className="w-full px-4 py-3 mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shimmer-btn"
            >
              {savingSmtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save SMTP Config
            </button>
          </form>
        </div>

        {/* Email Templates */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-850">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-400" />
            Notification Templates & Target
          </h2>
          <form onSubmit={handleSaveTemplates} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Global Recipient Address (Admin Email)</label>
                <input
                  type="email"
                  placeholder="admin@yourdomain.com"
                  value={templates.email_recipient?.to_email || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    email_recipient: { ...templates.email_recipient, to_email: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Specify the global administrator email recipient.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Expiry Warning Sent To</label>
                  <select
                    value={templates.email_recipient?.warning_recipient_type || 'admin'}
                    onChange={(e) => setTemplates({
                      ...templates,
                      email_recipient: { ...templates.email_recipient, warning_recipient_type: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm bg-dark-900"
                  >
                    <option value="admin">Global Admin Address</option>
                    <option value="customer">Customer Email Directly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Service Expired Sent To</label>
                  <select
                    value={templates.email_recipient?.expired_recipient_type || 'customer'}
                    onChange={(e) => setTemplates({
                      ...templates,
                      email_recipient: { ...templates.email_recipient, expired_recipient_type: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm bg-dark-900"
                  >
                    <option value="admin">Global Admin Address</option>
                    <option value="customer">Customer Email Directly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 my-4 pt-4">
              <h3 className="text-sm font-bold text-slate-300 mb-3">Service Expiry Alert Template</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={templates.expiry_warning?.subject || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    expiry_warning: { ...templates.expiry_warning, subject: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-xs"
                  required
                />
                <textarea
                  placeholder="Email Body Text"
                  value={templates.expiry_warning?.body || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    expiry_warning: { ...templates.expiry_warning, body: e.target.value }
                  })}
                  rows="3"
                  className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-xs resize-none"
                  required
                />
                <span className="text-[10px] text-slate-500 block">Available tokens: <code>{`{customer_name}`}</code>, <code>{`{service_name}`}</code>, <code>{`{days}`}</code>, <code>{`{expiry_date}`}</code></span>
              </div>
            </div>

            <div className="border-t border-slate-800 my-4 pt-4">
              <h3 className="text-sm font-bold text-slate-300 mb-3">Service Expired Alert Template</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={templates.expiry_expired?.subject || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    expiry_expired: { ...templates.expiry_expired, subject: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-xs"
                  required
                />
                <textarea
                  placeholder="Email Body Text"
                  value={templates.expiry_expired?.body || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    expiry_expired: { ...templates.expiry_expired, body: e.target.value }
                  })}
                  rows="3"
                  className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-xs resize-none"
                  required
                />
                <span className="text-[10px] text-slate-500 block">Available tokens: <code>{`{customer_name}`}</code>, <code>{`{service_name}`}</code>, <code>{`{expiry_date}`}</code></span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-sm font-bold text-slate-300 mb-3">Payment Reminder Template</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={templates.payment_reminder?.subject || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    payment_reminder: { ...templates.payment_reminder, subject: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-xs"
                  required
                />
                <textarea
                  placeholder="Email Body Text"
                  value={templates.payment_reminder?.body || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    payment_reminder: { ...templates.payment_reminder, body: e.target.value }
                  })}
                  rows="3"
                  className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-xs resize-none"
                  required
                />
                <span className="text-[10px] text-slate-500 block">Available tokens: <code>{`{customer_name}`}</code>, <code>{`{service_name}`}</code>, <code>{`{amount}`}</code>, <code>{`{currency}`}</code>, <code>{`{due_date}`}</code></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTemplates}
              className="w-full px-4 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shimmer-btn"
            >
              {savingTemplates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Email Templates
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
