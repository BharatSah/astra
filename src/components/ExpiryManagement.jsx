import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, Mail, X, ShieldAlert, Phone, Calendar, Clock } from 'lucide-react';

export default function ExpiryManagement({ onNotify, onTriggerEmail }) {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('customers'); // customers or rules

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cname, setCname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [note, setNote] = useState('');
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(7);
  const [expiryDate, setExpiryDate] = useState('');

  // Email template settings (fetched for alert evaluation)
  const [templates, setTemplates] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const servicesRes = await supabase.from('services').select('*').order('name', { ascending: true });
      const customersRes = await supabase.from('customers').select('*').order('expiry_date', { ascending: true });
      const settingsRes = await supabase.from('system_settings').select('*');

      if (servicesRes.error) throw servicesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setServices(servicesRes.data || []);
      setCustomers(customersRes.data || []);

      if (settingsRes.data) {
        const temp = settingsRes.data.find(x => x.key === 'email_templates');
        if (temp) setTemplates(temp.value);
      }
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error loading customers and rules data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setCname('');
    setEmail('');
    setPhone('');
    setServiceId(services[0]?.id || '');
    setNote('');
    setNotifyBeforeDays(7);
    setExpiryDate('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingId(cust.id);
    setCname(cust.cname);
    setEmail(cust.email);
    setPhone(cust.phone || '');
    setServiceId(cust.service_id || '');
    setNote(cust.note || '');
    setNotifyBeforeDays(cust.notify_before_days);
    setExpiryDate(cust.expiry_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cname || !email || !expiryDate || !serviceId) {
      onNotify('warning', 'Please fill in all required fields');
      return;
    }

    // Determine status based on dates
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
      status
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Customer record updated successfully');
      } else {
        const { error } = await supabase.from('customers').insert(payload);
        if (error) throw error;
        onNotify('success', 'Customer record saved successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error saving customer information');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Customer record deleted');
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error deleting customer');
    }
  };

  // Evaluate Rules and Simulate/Send Email Warning
  const handleTriggerWarning = (customer) => {
    if (!templates) {
      onNotify('warning', 'Email templates are not loaded. Set them in settings first.');
      return;
    }

    const serviceObj = services.find(s => s.id === customer.service_id);
    const serviceName = serviceObj ? serviceObj.name : 'Selected Service';

    // Fetch Recipient
    const recipient = templates.email_recipient?.to_email || customer.email;

    // Build Email body and subject using tokens
    let subject = templates.expiry_warning?.subject || 'Warning: Service expiring';
    let body = templates.expiry_warning?.body || 'Your service {service_name} is expiring.';

    const daysLeft = Math.ceil((new Date(customer.expiry_date) - new Date()) / (1000 * 3600 * 24));

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

    // Call layout handler to log email simulation
    onTriggerEmail({
      recipient,
      subject,
      body,
      type: 'Expiry Alert'
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Expiry <span className="gradient-text-purple">Management</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Automate alerts for subscription models, certificates, and domain durations.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'customers' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer Directory
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'rules' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Rules
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium text-sm transition duration-200 shadow-lg shadow-brand-500/10 shimmer-btn"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
        </div>
      ) : activeTab === 'customers' ? (
        /* Customers List */
        customers.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">No customer expiries scheduled yet.</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              Add customer profile & rules &rarr;
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Alert Trigger</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers.map((cust) => {
                    const serv = services.find(s => s.id === cust.service_id);
                    const expiry = new Date(cust.expiry_date);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

                    return (
                      <tr key={cust.id} className="hover:bg-slate-900/30 transition">
                        {/* Details */}
                        <td className="p-4">
                          <div className="font-bold text-slate-200">{cust.cname}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{cust.email}</div>
                          {cust.phone && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {cust.phone}
                            </div>
                          )}
                        </td>

                        {/* Service */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-800 font-medium">
                            {serv ? serv.name : 'Unknown Service'}
                          </span>
                          {cust.note && (
                            <p className="text-xs text-slate-400 max-w-xs truncate mt-1.5" title={cust.note}>
                              {cust.note}
                            </p>
                          )}
                        </td>

                        {/* Expiry Date */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">
                            {new Date(cust.expiry_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <div className={`text-xs mt-1 font-medium ${
                            daysRemaining <= 0 ? 'text-rose-400' : daysRemaining <= cust.notify_before_days ? 'text-orange-400' : 'text-emerald-400'
                          }`}>
                            {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days remaining`}
                          </div>
                        </td>

                        {/* Rules / Alert settings */}
                        <td className="p-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-400" />
                            Notify {cust.notify_before_days} days before
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            cust.status === 'active' ? 'badge-active' : cust.status === 'warning' ? 'badge-warning' : 'badge-expired'
                          }`}>
                            {cust.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleTriggerWarning(cust)}
                              className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/50 rounded-xl transition"
                              title="Evaluate Rules & Dispatch Mail Alert"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(cust)}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-xl transition"
                              title="Edit Client"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cust.id, cust.cname)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-xl transition"
                              title="Delete Client"
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
        )
      ) : (
        /* Rules Tab Explanation */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Expiry Rule Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20">
                <Clock className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-200">Rule 1: Expiry Alert Trigger</h3>
                <p className="text-xs text-slate-400">Triggered prior to system expiration</p>
              </div>
            </div>

            <div className="bg-dark-950/60 p-4 rounded-xl border border-slate-900 space-y-3 text-sm">
              <p className="text-slate-300 font-medium">Condition:</p>
              <p className="text-xs text-slate-400">
                If the remaining duration of a customer's active service falls below or matches the configured <code>Notify before expiry</code> threshold (days), the customer status is designated as <span className="text-orange-400 font-semibold">Warning</span>.
              </p>
              <div className="h-px bg-slate-800 my-2"></div>
              <p className="text-slate-300 font-medium">Action Dispatcher:</p>
              <p className="text-xs text-slate-400">
                Dispatches a customized notice warning containing service dates, duration remaining, and client renewal invoice info via Gmail SMTP to the global administrator recipient.
              </p>
            </div>
          </div>

          {/* Expired Rule Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-200">Rule 2: Terminus / Expired Check</h3>
                <p className="text-xs text-slate-400">Triggered upon target expiration date</p>
              </div>
            </div>

            <div className="bg-dark-950/60 p-4 rounded-xl border border-slate-900 space-y-3 text-sm">
              <p className="text-slate-300 font-medium">Condition:</p>
              <p className="text-xs text-slate-400">
                If the remaining duration of a customer's service date becomes less than or equal to 0, the customer's status transitions automatically to <span className="text-rose-400 font-semibold">Expired</span>.
              </p>
              <div className="h-px bg-slate-800 my-2"></div>
              <p className="text-slate-300 font-medium">Action Dispatcher:</p>
              <p className="text-xs text-slate-400">
                Instantly generates a critical warning email to suspend access, flags the billing department, and alerts the customer email directly concerning immediate service deactivation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 to-indigo-600"></div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-400" />
                  {editingId ? 'Modify Customer Record' : 'Enroll Customer & Expiry Rule'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-900 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {services.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400 space-y-3">
                  <p>You must create a service in Settings first before enrolling customers.</p>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      onNotify('warning', 'Please navigate to Settings > Service Catalog to configure services');
                    }}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Go to Settings
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Customer Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Aiden Vance"
                        value={cname}
                        onChange={(e) => setCname(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        placeholder="e.g. client@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 555-0199"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Service Dropdown *</label>
                      <select
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm bg-dark-900"
                        required
                      >
                        <option value="" disabled>Select service</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Expiry Date *</label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Notify Before Expiry (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={notifyBeforeDays}
                        onChange={(e) => setNotifyBeforeDays(parseInt(e.target.value) || 7)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Note</label>
                    <textarea
                      placeholder="Enter subscription rules, domain provider details or other remarks..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-900 text-slate-300 hover:text-white rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium shadow-lg shadow-brand-500/10 transition duration-200 shimmer-btn"
                    >
                      {editingId ? 'Update Client' : 'Schedule Rule'}
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
