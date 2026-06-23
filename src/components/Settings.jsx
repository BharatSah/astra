import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Mail, Server, Shield, RefreshCw, Save } from 'lucide-react';

export default function Settings({ onNotify }) {
  const [activeSubTab, setActiveSubTab] = useState('services');
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // SMTP Settings
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
    email_recipient: { to_email: '' },
    payment_reminder: { subject: '', body: '' }
  });

  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true });
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err.message);
      onNotify('error', 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

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

  useEffect(() => {
    fetchServices();
    fetchSystemSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      const { error } = await supabase.from('services').insert({
        name: newServiceName.trim(),
        description: newServiceDesc.trim()
      });
      if (error) throw error;

      onNotify('success', 'Service added successfully');
      setNewServiceName('');
      setNewServiceDesc('');
      fetchServices();
    } catch (err) {
      console.error('Error adding service:', err.message);
      onNotify('error', err.message.includes('unique') ? 'Service name already exists' : 'Failed to add service');
    }
  };

  const handleDeleteService = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the service "${name}"? Customers using this service will lose their association.`)) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;

      onNotify('success', 'Service deleted successfully');
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err.message);
      onNotify('error', 'Failed to delete service');
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
    <div className="space-y-8 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          System <span className="gradient-text-purple">Settings</span>
        </h1>
        <p className="text-slate-400 mt-1">Configure service catalogs, SMTP servers, and notification templates.</p>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-slate-800 space-x-8">
        <button
          onClick={() => setActiveSubTab('services')}
          className={`pb-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
            activeSubTab === 'services'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Service Catalog
        </button>
        <button
          onClick={() => setActiveSubTab('smtp')}
          className={`pb-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
            activeSubTab === 'smtp'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Email & SMTP Config
        </button>
      </div>

      {/* Services Content */}
      {activeSubTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Service Panel */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-850 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Add New Service
            </h2>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Cloud Hosting"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                <textarea
                  placeholder="Service particulars, pricing, or details..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-brand-500/10 shimmer-btn"
              >
                Create Service
              </button>
            </form>
          </div>

          {/* Service List */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-850">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Server className="w-5 h-5 text-brand-400" />
                Service Directory
              </h2>
              <button onClick={fetchServices} className="text-slate-400 hover:text-white transition">
                <RefreshCw className={`w-4 h-4 ${loadingServices ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingServices ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No services found. Add your first service using the panel.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto pr-2">
                {services.map((service) => (
                  <div key={service.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="pr-4">
                      <h3 className="font-semibold text-slate-200">{service.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{service.description || 'No description provided.'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteService(service.id, service.name)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMTP Content */}
      {activeSubTab === 'smtp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Global Recipient Address (To Whom mail goes to)</label>
                <input
                  type="email"
                  placeholder="admin@yourdomain.com"
                  value={templates.email_recipient?.to_email || ''}
                  onChange={(e) => setTemplates({
                    ...templates,
                    email_recipient: { to_email: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Specify who receives these automated updates (e.g. system administrator).</span>
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
      )}
    </div>
  );
}
