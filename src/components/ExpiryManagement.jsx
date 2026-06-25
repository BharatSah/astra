import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Edit2,
  Trash2,
  Mail,
  X,
  Search,
  Info,
  Sliders,
  UserPlus
} from 'lucide-react';

export default function ExpiryManagement({ onNotify, onTriggerEmail }) {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  // Modal form visibility
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Expiry form states
  const [editingId, setEditingId] = useState(null);
  const [cname, setCname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [note, setNote] = useState('');
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(7);
  const [expiryDate, setExpiryDate] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Email template settings
  const [templates, setTemplates] = useState(null);

  const fetchData = async () => {
        try {
      const servicesRes = await supabase.from('services').select('*').order('name', { ascending: true });
      const customersRes = await supabase.from('customers').select('*').order('expiry_date', { ascending: true });
      const settingsRes = await supabase.from('system_settings').select('*');

      if (servicesRes.error) throw servicesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setServices(servicesRes.data || []);
      const custData = customersRes.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedCustomers = custData.map(cust => {
        const expiry = new Date(cust.expiry_date);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        let currentStatus = 'active';
        if (daysLeft <= 0) currentStatus = 'expired';
        else if (daysLeft <= cust.notify_before_days) currentStatus = 'warning';

        // Auto-send expired emails on load
        if (daysLeft <= 0 && (cust.recipient_emails || cust.email)) {
          const sentKey = `expiry_sent_${cust.id}_${today.toISOString().split('T')[0]}`;
          if (!localStorage.getItem(sentKey)) {
            localStorage.setItem(sentKey, 'true');
            autoSendExpiredEmail(cust, servicesRes.data || [], settingsRes.data);
          }
        }
        
        return { ...cust, status: currentStatus };
      });

      if (settingsRes.data) {
        const temp = settingsRes.data.find(x => x.key === 'email_templates');
        if (temp) setTemplates(temp.value);
      }

      setCustomers(processedCustomers);
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error loading expiry configuration data');
    }
  };

  const autoSendExpiredEmail = (customer, servicesData, settingsData) => {
    let tpl = null;
    if (settingsData) {
      const temp = settingsData.find(x => x.key === 'email_templates');
      if (temp) tpl = temp.value;
    }

    const serviceObj = servicesData.find(s => s.id === customer.service_id);
    const serviceName = serviceObj ? serviceObj.name : 'Service';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(customer.expiry_date);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let subject = tpl?.expiry_expired?.subject || 'Critical: Your service {service_name} has expired';
    let body = tpl?.expiry_expired?.body || 'Dear {customer_name},\n\nYour service {service_name} expired on {expiry_date}.\n\nPlease renew immediately.\n\nBest regards,\nAstra';

    subject = subject
      .replace(/{customer_name}/g, customer.cname)
      .replace(/{service_name}/g, serviceName)
      .replace(/{days}/g, Math.abs(daysLeft))
      .replace(/{expiry_date}/g, customer.expiry_date);

    body = body
      .replace(/{customer_name}/g, customer.cname)
      .replace(/{service_name}/g, serviceName)
      .replace(/{days}/g, Math.abs(daysLeft))
      .replace(/{expiry_date}/g, customer.expiry_date);

    const recipients = customer.recipient_emails
      ? customer.recipient_emails.split(',').map(e => e.trim()).filter(Boolean)
      : [customer.email];
    recipients.forEach(recipient => {
      onTriggerEmail({
        recipient,
        subject,
        body,
        type: 'Auto Expired Alert'
      });
    });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const handleResetForm = () => {
    setEditingId(null);
    setCname('');
    setEmail('');
    setPhone('');
    setServiceId(services[0]?.id || '');
    setNote('');
    setNotifyBeforeDays(7);
    setExpiryDate('');
    setRecipientEmails('');
  };

  const handleOpenForm = () => {
    handleResetForm();
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    handleResetForm();
  };

  const handleLoadEdit = (cust) => {
    setEditingId(cust.id);
    setCname(cust.cname);
    setEmail(cust.email);
    setPhone(cust.phone || '');
    setServiceId(cust.service_id || '');
    setNote(cust.note || '');
    setNotifyBeforeDays(cust.notify_before_days);
    setExpiryDate(cust.expiry_date);
    setRecipientEmails(cust.recipient_emails || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cname || !email || !expiryDate || !serviceId) {
      onNotify('warning', 'Please fill in all required fields');
      return;
    }

    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let status = 'active';
    if (daysRemaining <= 0) {
      status = 'expired';
    } else if (daysRemaining <= notifyBeforeDays) {
      status = 'warning';
    }

    const payload = {
      cname,
      email,
      phone,
      service_id: serviceId,
      note,
      notify_before_days: parseInt(notifyBeforeDays) || 7,
      expiry_date: expiryDate,
      recipient_emails: recipientEmails ? recipientEmails.trim() : '',
      status
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', `Rule for ${cname} has been updated`);
      } else {
        const { error } = await supabase.from('customers').insert(payload);
        if (error) throw error;
        onNotify('success', `Rule for ${cname} has been created`);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      console.error('Supabase error:', err);
      onNotify('error', err.message || JSON.stringify(err) || 'Failed to save rule information');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete rule "${name}"?`)) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Expiry rule deleted successfully');
      if (editingId === id) handleResetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error deleting expiry rule');
    }
  };

  const handleTriggerWarning = (customer) => {
    if (!templates) {
      onNotify('warning', 'Email templates not loaded. Configure in Settings first.');
      return;
    }

    const serviceObj = services.find(s => s.id === customer.service_id);
    const serviceName = serviceObj ? serviceObj.name : 'Selected Service';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(customer.expiry_date);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isExpired = daysLeft <= 0;

    let subject = '';
    let body = '';
    let emailType = 'Expiry Alert';

    if (isExpired) {
      subject = templates.expiry_expired?.subject || 'Critical: Service {service_name} has expired';
      body = templates.expiry_expired?.body || 'Your service {service_name} has expired.';
      emailType = 'Service Expired Alert';
    } else {
      subject = templates.expiry_warning?.subject || 'Warning: Service {service_name} expiring soon';
      body = templates.expiry_warning?.body || 'Your service {service_name} is expiring soon.';
      emailType = 'Expiry Warning Alert';
    }

    subject = subject
      .replace(/{customer_name}/g, customer.cname)
      .replace(/{service_name}/g, serviceName)
      .replace(/{days}/g, Math.max(0, daysLeft))
      .replace(/{expiry_date}/g, customer.expiry_date);

    body = body
      .replace(/{customer_name}/g, customer.cname)
      .replace(/{service_name}/g, serviceName)
      .replace(/{days}/g, Math.max(0, daysLeft))
      .replace(/{expiry_date}/g, customer.expiry_date);

    const recipientList = customer.recipient_emails
      ? customer.recipient_emails.split(',').map(e => e.trim()).filter(Boolean)
      : [customer.email];

    recipientList.forEach(recipient => {
      onTriggerEmail({
        recipient,
        subject,
        body,
        type: emailType
      });
    });
  };

  // Filtered List
  const filteredCustomers = customers.filter(cust => {
    const matchSearch =
      cust.cname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.note && cust.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || cust.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-slide-up flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
          Expiry Control <span className="text-slate-400 text-base font-semibold ml-1">({filteredCustomers.length} total)</span>
        </h1>
      </div>

      {/* Compact top bar: Search + Filter left, Add Button right */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-slate-200 glass-input text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-slate-300 glass-input text-xs bg-dark-900 font-semibold shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition duration-200 shrink-0 sm:w-auto w-full justify-center"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Full-Height Rules Table */}
      {filteredCustomers.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850 flex-1 flex flex-col items-center justify-center">
          <Sliders className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No expiry rules found matching your criteria.</p>
          <button
            onClick={handleOpenForm}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Create your first expiry rule &rarr;
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-semibold text-xs">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4">Send To</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredCustomers.map((cust) => {
                  const serv = services.find(s => s.id === cust.service_id);
                  const expiry = new Date(cust.expiry_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-slate-900/30 transition group ${editingId === cust.id ? 'bg-purple-950/20' : ''
                        }`}
                    >
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="font-bold text-slate-200 text-sm">{cust.cname}</div>
                        <div className="text-slate-400 mt-0.5">{cust.email}</div>
                        {cust.phone && (
                          <div className="text-slate-500 mt-0.5">{cust.phone}</div>
                        )}
                      </td>

                      {/* Service */}
                      <td className="p-4">
                        {serv && (
                          <span className="inline-block px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg border border-slate-800 text-[11px] font-semibold">
                            {serv.name}
                          </span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="p-4">
                        <div className="font-bold text-slate-200">
                          {expiry.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className={`mt-1 font-semibold ${daysRemaining <= 0
                            ? 'text-rose-400'
                            : daysRemaining <= cust.notify_before_days
                              ? 'text-orange-400'
                              : 'text-emerald-400'
                          }`}>
                          {daysRemaining <= 0 ? `Expired ${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Alert: {cust.notify_before_days}d before
                        </div>
                      </td>

                      {/* Send To */}
                      <td className="p-4">
                        <div className="text-slate-300 text-[11px] max-w-[160px] truncate" title={cust.recipient_emails || cust.email}>
                          {cust.recipient_emails || cust.email}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${cust.status === 'active'
                            ? 'badge-active'
                            : cust.status === 'warning'
                              ? 'badge-warning'
                              : 'badge-expired'
                          }`}>
                          {cust.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTriggerWarning(cust)}
                            className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/40 rounded-xl transition duration-150"
                            title="Send Email Alert"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLoadEdit(cust)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/40 rounded-xl transition duration-150"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id, cust.cname)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-xl transition duration-150"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Modal Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-slide-up">
          <div className="w-full max-w-2xl glass-panel border border-slate-800 rounded-2xl shadow-2xl shadow-brand-500/10 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  {editingId ? <Edit2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Customer Rule' : 'Add Customer'}</h2>
                  <p className="text-xs text-slate-400">
                    {editingId ? 'Update expiry rule details.' : 'Create a new client expiry and notification rule.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto">
              {services.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <Info className="w-7 h-7" />
                  </div>
                  <p>You must configure services in System Settings first.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Customer Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={cname}
                        onChange={(e) => setCname(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="admin@acme.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Service <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm bg-dark-900 cursor-pointer transition-all duration-200 focus:scale-[1.01]"
                        required
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Expiry Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Notify Before <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={notifyBeforeDays}
                          onChange={(e) => setNotifyBeforeDays(parseInt(e.target.value) || 7)}
                          className="w-full px-4 py-3 rounded-xl text-center text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                          required
                        />
                        <span className="text-xs text-slate-500 font-semibold">days</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Send Mail To</label>
                    <input
                      type="text"
                      placeholder="e.g. admin@company.com, manager@company.com"
                      value={recipientEmails}
                      onChange={(e) => setRecipientEmails(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">Defaults to customer email if blank. Separate multiple emails with commas.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Note</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any extra details about this client or contract..."
                      rows="3"
                      className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm font-sans leading-relaxed resize-none transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 text-sm">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-800 transition-all duration-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold transition-all duration-200 shadow-lg shadow-brand-500/10 shimmer-btn cursor-pointer"
                    >
                      {editingId ? 'Update Customer Rule' : 'Save Customer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
