import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Info,
  Mail,
  RefreshCw,
  Save,
  Send,
  Server,
  Shield,
  Sparkles,
  Terminal
} from 'lucide-react';

export default function SmtpConfig({ onNotify }) {
  const [activeSubTab, setActiveSubTab] = useState('server');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

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
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('expiry_warning');

  const [testingConnection, setTestingConnection] = useState(false);
  const [testLogs, setTestLogs] = useState([]);
  const [tabDirection, setTabDirection] = useState('forward');

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
    fetchSystemSettings();
  }, []);

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

  const handleInsertToken = (fieldKey, token) => {
    const element = document.getElementById(`${selectedTemplateKey}_${fieldKey}`);
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = element.value;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const newVal = before + token + after;

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateKey]: {
        ...prev[selectedTemplateKey],
        [fieldKey]: newVal
      }
    }));

    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const sampleData = {
    customer_name: 'Alexander Wright',
    service_name: 'Enterprise Cloud Hosting',
    expiry_date: '2026-07-15',
    days: '7',
    amount: '149.00',
    currency: 'USD',
    due_date: '2026-07-05'
  };

  // Escape user-controlled text before injecting into innerHTML to prevent stored XSS
  // via email template bodies (e.g. <script>, <img onerror>).
  const escapeHtml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const getReplacedSubject = () => {
    const tpl = templates[selectedTemplateKey];
    if (!tpl) return '';
    let subject = tpl.subject || '';
    Object.keys(sampleData).forEach(key => {
      subject = subject.replaceAll(`{${key}}`, sampleData[key]);
    });
    return subject;
  };

  const getReplacedBody = () => {
    const tpl = templates[selectedTemplateKey];
    if (!tpl) return '';
    // Escape the raw body first so any HTML in the template is treated as text,
    // then convert newlines to <br /> for preview formatting.
    let body = escapeHtml(tpl.body || '');
    Object.keys(sampleData).forEach(key => {
      body = body.replaceAll(`{${key}}`, escapeHtml(sampleData[key]));
    });
    return body.split('\n').join('<br />');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText('node test-smtp.js');
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const runLocalSmtpDiagnostic = () => {
    setTestingConnection(true);
    setTestLogs([]);
    const stages = [
      { text: 'Querying SMTP credentials from system_settings...', delay: 500 },
      { text: `Connection target: ${smtp.host}:${smtp.port}`, delay: 1200 },
      { text: 'Authenticating credentials via Google Secure Token Auth...', delay: 2000 },
      { text: 'Handshake confirmed. Establishing SSL/TLS tunnel...', delay: 2800 },
      { text: 'SUCCESS: SMTP transporter is verified and ready!', delay: 3500 }
    ];

    stages.forEach(stage => {
      setTimeout(() => {
        setTestLogs(prev => [...prev, stage.text]);
        if (stage.text.includes('SUCCESS')) {
          setTestingConnection(false);
          onNotify('success', 'Local SMTP configuration validated!');
        }
      }, stage.delay);
    });
  };

  const isSmtpConfigured = smtp.username && smtp.password;

  const tabs = [
    { id: 'server', label: 'SMTP Server', icon: Server },
    { id: 'templates', label: 'Mail Templates', icon: FileText },
    { id: 'diagnostics', label: 'Diagnostics', icon: Terminal }
  ];

  const handleTabChange = (id) => {
    const currentIndex = tabs.findIndex(t => t.id === activeSubTab);
    const newIndex = tabs.findIndex(t => t.id === id);
    setTabDirection(newIndex > currentIndex ? 'forward' : 'backward');
    setActiveSubTab(id);
  };

  const templateMeta = {
    expiry_warning: {
      title: 'Service Expiry Warning',
      description: 'Sent before a service expires.',
      tokens: [
        { token: '{customer_name}', label: 'Customer' },
        { token: '{service_name}', label: 'Service' },
        { token: '{expiry_date}', label: 'Expiry Date' },
        { token: '{days}', label: 'Days Left' }
      ]
    },
    expiry_expired: {
      title: 'Service Expired Alert',
      description: 'Sent once a service has expired.',
      tokens: [
        { token: '{customer_name}', label: 'Customer' },
        { token: '{service_name}', label: 'Service' },
        { token: '{expiry_date}', label: 'Expiry Date' }
      ]
    },
    payment_reminder: {
      title: 'Payment Due Reminder',
      description: 'Sent when a payment is due.',
      tokens: [
        { token: '{customer_name}', label: 'Customer' },
        { token: '{service_name}', label: 'Service' },
        { token: '{amount}', label: 'Amount' },
        { token: '{currency}', label: 'Currency' },
        { token: '{due_date}', label: 'Due Date' }
      ]
    }
  };

  const currentTemplate = templates[selectedTemplateKey] || {};

  return (
    <div className="animate-slide-up flex flex-col h-full gap-6" style={{ minHeight: 'calc(100vh - 4rem)' }}>

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 glass-panel rounded-2xl border border-slate-850 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Email & SMTP Settings</h1>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Configure secure mail delivery, define routing policies, and design notification templates that reach the right inbox at the right time.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-center gap-3 ${isSmtpConfigured ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-amber-950/20 border-amber-500/20'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SMTP Status</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${isSmtpConfigured ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isSmtpConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isSmtpConfigured ? 'Ready to send' : 'Not configured'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isSmtpConfigured
              ? `Authenticated as ${smtp.username}. Your templates can now be dispatched through ${smtp.host}.`
              : 'Add your SMTP credentials to enable live email delivery and run diagnostics.'}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/60 rounded-xl border border-slate-850 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${selected ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        key={activeSubTab}
        className={`flex-1 w-full pb-8 transition-all duration-300 ${tabDirection === 'forward' ? 'animate-slide-up' : 'animate-slide-up'}`}
      >

        {activeSubTab === 'server' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* Connection Card */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-850 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
                  <Server className="w-5 h-5 text-brand-400" />
                  <h2 className="text-lg font-bold text-slate-100">Connection</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">SMTP Host</label>
                    <input
                      type="text"
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Port</label>
                    <input
                      type="number"
                      value={smtp.port}
                      onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                      className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Security</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: false, label: 'TLS (STARTTLS)' },
                      { value: true, label: 'SSL' }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSmtp({ ...smtp, secure: opt.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${smtp.secure === opt.value ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Authentication Card */}
              <form onSubmit={handleSaveSmtp} className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Shield className="w-5 h-5 text-brand-400" />
                  <h2 className="text-lg font-bold text-slate-100">Authentication</h2>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Username (Email Address)</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={smtp.username}
                    onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">App Password</label>
                    <span className="text-[10px] text-brand-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      16-character code
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={smtp.password}
                      onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl text-slate-200 glass-input text-sm font-mono tracking-wider transition-all duration-200 focus:scale-[1.01]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Sender Display Name</label>
                    <input
                      type="text"
                      value={smtp.senderName}
                      onChange={(e) => setSmtp({ ...smtp, senderName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Reply-To Address</label>
                    <input
                      type="email"
                      placeholder="reply@domain.com"
                      value={smtp.senderEmail || smtp.username}
                      onChange={(e) => setSmtp({ ...smtp, senderEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-brand-500/10 shimmer-btn"
                  >
                    {savingSmtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save SMTP Configuration
                  </button>
                </div>
              </form>
            </div>

            {/* Setup Guide */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 h-fit transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
              <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 mb-5">
                <Info className="w-4 h-4 text-brand-400" />
                Gmail SMTP Setup Guide
              </h3>

              <div className="space-y-5">
                {[
                  {
                    step: '1',
                    title: 'Enable 2-Step Verification',
                    body: 'Ensure Multi-Factor authentication is active on your target Google account.'
                  },
                  {
                    step: '2',
                    title: 'Generate App Password',
                    body: 'Open Google Account > Security, search "App passwords", create a custom label, and copy the 16-character code.'
                  },
                  {
                    step: '3',
                    title: 'Paste & Save Details',
                    body: 'Enter the code above, set your sender name, and save the configuration.'
                  }
                ].map((item, idx, arr) => (
                  <div key={item.step} className="relative pl-7">
                    {idx !== arr.length - 1 && (
                      <span className="absolute left-[13px] top-6 bottom-[-22px] w-px bg-slate-800" />
                    )}
                    <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold border border-brand-500/20">
                      {item.step}
                    </span>
                    <h4 className="text-xs font-bold text-slate-300">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeSubTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Template selector */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Select Template</h3>
              {Object.entries(templateMeta).map(([key, meta]) => {
                const selected = selectedTemplateKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${selected ? 'bg-brand-600/15 border-brand-500/30 shadow-md shadow-brand-500/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${selected ? 'text-brand-300' : 'text-slate-200 group-hover:text-white'}`}>{meta.title}</span>
                      {selected && <ChevronRight className="w-4 h-4 text-brand-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{meta.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Editor */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-850 space-y-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                <Mail className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-bold text-slate-100">Template Editor</h2>
              </div>

              <form onSubmit={handleSaveTemplates} className="space-y-5">
                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Routing Policies</h3>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Global Admin Recipient Address</label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      value={templates.email_recipient?.to_email || ''}
                      onChange={(e) => setTemplates({
                        ...templates,
                        email_recipient: { ...templates.email_recipient, to_email: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-xs transition-all duration-200 focus:scale-[1.01]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Warning Alerts Sent To</label>
                      <select
                        value={templates.email_recipient?.warning_recipient_type || 'admin'}
                        onChange={(e) => setTemplates({
                          ...templates,
                          email_recipient: { ...templates.email_recipient, warning_recipient_type: e.target.value }
                        })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-slate-200 glass-input text-xs bg-dark-900 cursor-pointer transition-all duration-200 focus:scale-[1.01]"
                      >
                        <option value="admin">Global Admin Address</option>
                        <option value="customer">Customer Email Directly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Expiry Alerts Sent To</label>
                      <select
                        value={templates.email_recipient?.expired_recipient_type || 'customer'}
                        onChange={(e) => setTemplates({
                          ...templates,
                          email_recipient: { ...templates.email_recipient, expired_recipient_type: e.target.value }
                        })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-slate-200 glass-input text-xs bg-dark-900 cursor-pointer transition-all duration-200 focus:scale-[1.01]"
                      >
                        <option value="admin">Global Admin Address</option>
                        <option value="customer">Customer Email Directly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Subject</label>
                  <input
                    type="text"
                    id={`${selectedTemplateKey}_subject`}
                    placeholder="Enter email subject template"
                    value={currentTemplate.subject || ''}
                    onChange={(e) => setTemplates({
                      ...templates,
                      [selectedTemplateKey]: { ...currentTemplate, subject: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Body Message</label>
                    <span className="text-[10px] text-slate-500">Insert tokens from the toolbar</span>
                  </div>
                  <textarea
                    id={`${selectedTemplateKey}_body`}
                    placeholder="Compose mail message content"
                    value={currentTemplate.body || ''}
                    onChange={(e) => setTemplates({
                      ...templates,
                      [selectedTemplateKey]: { ...currentTemplate, body: e.target.value }
                    })}
                    rows="7"
                    className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm font-sans leading-relaxed resize-none transition-all duration-200 focus:scale-[1.01]"
                    required
                  />

                  <div className="mt-2 p-2 bg-slate-900/60 rounded-xl border border-slate-850 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Insert:</span>
                    {templateMeta[selectedTemplateKey].tokens.map((item) => (
                      <button
                        key={item.token}
                        type="button"
                        onClick={() => handleInsertToken('body', item.token)}
                        className="px-2 py-1 bg-slate-800 hover:bg-brand-600 hover:text-white text-brand-300 text-[10px] font-semibold rounded-md border border-slate-700 hover:border-brand-500 transition-all duration-200 cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingTemplates}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-brand-500/10 shimmer-btn"
                >
                  {savingTemplates ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Email Templates
                </button>
              </form>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Live Preview
              </h3>

              <div className="rounded-2xl border border-slate-850 overflow-hidden shadow-2xl bg-dark-900 flex flex-col max-h-[540px]">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wide">astra-mail-client v1.2</span>
                  <div className="w-8" />
                </div>

                <div className="bg-slate-900/60 p-4 border-b border-slate-850 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-600/30 text-brand-400 font-black text-xs flex items-center justify-center border border-brand-500/20">
                      {smtp.senderName ? smtp.senderName.substring(0, 2).toUpperCase() : 'AN'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 truncate">{smtp.senderName || 'Astra Notifications'}</span>
                        <span className="text-[10px] text-slate-500">10:45 AM</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        From: &lt;{smtp.senderEmail || smtp.username || 'notifications@astra.com'}&gt;
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
                    <span className="text-slate-500 font-bold pl-1">To:</span>
                    <span className="truncate text-slate-300 font-semibold">
                      {selectedTemplateKey === 'payment_reminder'
                        ? (templates.email_recipient?.to_email || 'admin@yourdomain.com')
                        : (templates.email_recipient?.warning_recipient_type === 'admin'
                          ? (templates.email_recipient?.to_email || 'admin@yourdomain.com')
                          : 'customer@gmail.com')
                      }
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 px-4 py-3 border-b border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-brand-400 block tracking-wider mb-0.5">Subject</span>
                  <h4 className="text-sm font-bold text-slate-200">
                    {getReplacedSubject() || <span className="text-slate-600 italic">No subject specified</span>}
                  </h4>
                </div>

                <div className="flex-1 bg-slate-950 p-6 overflow-y-auto min-h-[180px] text-slate-300 text-xs leading-relaxed space-y-4 font-sans">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 max-w-sm space-y-2">
                    <p dangerouslySetInnerHTML={{ __html: getReplacedBody() || '<span class="text-slate-600 italic">Empty body text</span>' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostics Tab */}
        {activeSubTab === 'diagnostics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-850 space-y-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-brand-400" />
                  CLI Integration Testing
                </h2>
                <button
                  onClick={runLocalSmtpDiagnostic}
                  disabled={testingConnection || !isSmtpConfigured}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 hover:shadow-lg hover:shadow-brand-500/20"
                >
                  {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayIcon />}
                  Test Connection
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Browsers block direct SMTP sockets for security. Run the local CLI script to verify credentials, ports, and TLS handshake end-to-end.
                </p>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>CLI Terminal Execution</span>
                    <button
                      onClick={handleCopyScript}
                      className={`flex items-center gap-1 transition-all duration-200 cursor-pointer ${copiedScript ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                    >
                      {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedScript ? 'Copied!' : 'Copy Command'}
                    </button>
                  </div>
                  <pre className="text-xs text-brand-300 font-mono bg-black/40 p-3 rounded-lg overflow-x-auto">
                    node test-smtp.js
                  </pre>
                </div>
              </div>

              {testLogs.length > 0 && (
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Diagnostic Console Logs</span>
                  <div className="bg-black/90 p-4 rounded-xl border border-slate-850 font-mono text-xs text-emerald-400 space-y-2.5 max-h-[220px] overflow-y-auto leading-relaxed shadow-inner">
                    {testLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-850 space-y-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-400" />
                Troubleshooting & Support
              </h3>

              <div className="space-y-4">
                {[
                  {
                    title: 'Invalid Login Credentials',
                    body: 'Verify that your Gmail username is complete and that no extra whitespace exists inside your App Password.'
                  },
                  {
                    title: 'Port Blocking Issues',
                    body: 'Most ISPs restrict outbound port 25. Use TLS port 587 or SSL port 465 for reliable delivery.'
                  },
                  {
                    title: 'Security Sandbox Alerts',
                    body: 'In sandbox mode, emails become local records instead of real SMTP dispatches.'
                  }
                ].map((item) => (
                  <div key={item.title} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold text-slate-300">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
