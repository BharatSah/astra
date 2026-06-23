import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Trash2, Mail, CheckCircle, X, Calendar, DollarSign, Wallet, Users, Clock } from 'lucide-react';

export default function PaymentReminders({ onNotify, onTriggerEmail }) {
  const [reminders, setReminders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active (pending/overdue) or paid

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [toPayDate, setToPayDate] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('pending');
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);

  // Email template storage
  const [templates, setTemplates] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const servicesRes = await supabase.from('services').select('*').order('name', { ascending: true });
      const remindersRes = await supabase.from('payment_reminders').select('*').order('to_pay_date', { ascending: true });
      const settingsRes = await supabase.from('system_settings').select('*');

      if (servicesRes.error) throw servicesRes.error;
      if (remindersRes.error) throw remindersRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setServices(servicesRes.data || []);
      setReminders(remindersRes.data || []);

      if (settingsRes.data) {
        const temp = settingsRes.data.find(x => x.key === 'email_templates');
        if (temp) setTemplates(temp.value);
      }
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error loading payment reminders data');
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
    setCustomerName('');
    setServiceId(services[0]?.id || '');
    setToPayDate('');
    setAmount('');
    setCurrency('USD');
    setStatus('pending');
    setNotifyDaysBefore(3);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rem) => {
    setEditingId(rem.id);
    setCustomerName(rem.customer_name);
    setServiceId(rem.service_id || '');
    setToPayDate(rem.to_pay_date);
    setAmount(rem.amount.toString());
    setCurrency(rem.currency);
    setStatus(rem.status);
    setNotifyDaysBefore(rem.notify_days_before);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !serviceId || !toPayDate || !amount) {
      onNotify('warning', 'Please fill in all required fields');
      return;
    }

    // Recalculate status based on pay date
    const payDate = new Date(toPayDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    let finalStatus = status;
    if (status !== 'paid') {
      finalStatus = payDate < today ? 'overdue' : 'pending';
    }

    const payload = {
      customer_name: customerName,
      service_id: serviceId,
      to_pay_date: toPayDate,
      amount: parseFloat(amount),
      currency,
      status: finalStatus,
      notify_days_before: parseInt(notifyDaysBefore) || 3
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('payment_reminders').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Reminder updated successfully');
      } else {
        const { error } = await supabase.from('payment_reminders').insert(payload);
        if (error) throw error;
        onNotify('success', 'Reminder scheduled successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error scheduling reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment reminder?')) return;
    try {
      const { error } = await supabase.from('payment_reminders').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Reminder deleted');
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error deleting reminder');
    }
  };

  const handleMarkAsPaid = async (rem) => {
    try {
      const { error } = await supabase.from('payment_reminders').update({ status: 'paid' }).eq('id', rem.id);
      if (error) throw error;
      onNotify('success', `Payment for ${rem.customer_name} marked as paid!`);
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error updating payment status');
    }
  };

  // Dispatch reminder email simulation
  const handleTriggerReminderEmail = (rem) => {
    if (!templates) {
      onNotify('warning', 'Templates not loaded. Configure settings first.');
      return;
    }

    const serviceObj = services.find(s => s.id === rem.service_id);
    const serviceName = serviceObj ? serviceObj.name : 'Selected Service';

    // Fetch Global admin email or default
    const recipient = templates.email_recipient?.to_email || 'admin@astra.com';

    let subject = templates.payment_reminder?.subject || 'Payment Reminder';
    let body = templates.payment_reminder?.body || 'A payment of {amount} is due.';

    // Replace tokens
    const currencySymbol = rem.currency === 'USD' ? '$' : 'Rs. ';
    const formattedAmount = `${currencySymbol}${rem.amount}`;

    subject = subject
      .replace(/{customer_name}/g, rem.customer_name)
      .replace(/{service_name}/g, serviceName)
      .replace(/{amount}/g, formattedAmount)
      .replace(/{currency}/g, rem.currency)
      .replace(/{due_date}/g, rem.to_pay_date);

    body = body
      .replace(/{customer_name}/g, rem.customer_name)
      .replace(/{service_name}/g, serviceName)
      .replace(/{amount}/g, formattedAmount)
      .replace(/{currency}/g, rem.currency)
      .replace(/{due_date}/g, rem.to_pay_date);

    onTriggerEmail({
      recipient,
      subject,
      body,
      type: 'Payment Reminder'
    });
  };

  // Filter reminders based on tab selection
  const filteredReminders = reminders.filter(rem => {
    if (activeTab === 'paid') return rem.status === 'paid';
    return rem.status !== 'paid';
  });

  const formatCurrency = (val, cur) => {
    if (cur === 'USD') return `$${parseFloat(val).toFixed(2)}`;
    return `Rs. ${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Payment <span className="gradient-text-purple">Reminders</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Create and automate client billing notifications, invoice deadlines, and currency tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'active' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Receivables
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'paid' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Settled / Paid
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium text-sm transition duration-200 shadow-lg shadow-brand-500/10 shimmer-btn"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </div>
      </div>

      {/* Grid Summary Stats */}
      {!loading && filteredReminders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Dues (USD)</p>
              <h4 className="text-xl font-extrabold text-slate-200 mt-0.5">
                {formatCurrency(
                  reminders.filter(r => r.status !== 'paid' && r.currency === 'USD').reduce((sum, r) => sum + parseFloat(r.amount), 0),
                  'USD'
                )}
              </h4>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Dues (NPR)</p>
              <h4 className="text-xl font-extrabold text-slate-200 mt-0.5">
                {formatCurrency(
                  reminders.filter(r => r.status !== 'paid' && r.currency === 'NPR').reduce((sum, r) => sum + parseFloat(r.amount), 0),
                  'NPR'
                )}
              </h4>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-4">
            <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Accounts</p>
              <h4 className="text-xl font-extrabold text-slate-200 mt-0.5">
                {reminders.filter(r => r.status !== 'paid').length} clients
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Main List Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No payment reminders scheduled here.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Create first payment reminder &rarr;
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Pay Date</th>
                  <th className="p-4">Amount Due</th>
                  <th className="p-4">Rule Settings</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReminders.map((rem) => {
                  const serv = services.find(s => s.id === rem.service_id);
                  const payDate = new Date(rem.to_pay_date);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const daysLeft = Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                  return (
                    <tr key={rem.id} className="hover:bg-slate-900/30 transition">
                      {/* Customer Name */}
                      <td className="p-4 font-bold text-slate-200">
                        {rem.customer_name}
                      </td>

                      {/* Associated Service */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-800 font-medium">
                          {serv ? serv.name : 'Unknown Service'}
                        </span>
                      </td>

                      {/* Pay Date */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">
                          {new Date(rem.to_pay_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        {rem.status !== 'paid' && (
                          <div className={`text-xs mt-1 font-medium ${daysLeft < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`}
                          </div>
                        )}
                      </td>

                      {/* Amount and Currency */}
                      <td className="p-4 font-bold text-slate-100 font-mono">
                        {formatCurrency(rem.amount, rem.currency)}
                      </td>

                      {/* Rule days */}
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand-400" />
                          Remind {rem.notify_days_before} days before
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          rem.status === 'paid' ? 'badge-active' : rem.status === 'overdue' ? 'badge-expired' : 'badge-warning'
                        }`}>
                          {rem.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Action Triggers */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {rem.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => handleMarkAsPaid(rem)}
                                className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTriggerReminderEmail(rem)}
                                className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/50 rounded-xl transition"
                                title="Send Email Reminder"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(rem)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-xl transition"
                            title="Edit Reminder"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rem.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-xl transition"
                            title="Delete Reminder"
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

      {/* Add / Edit Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 to-indigo-600"></div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-400" />
                  {editingId ? 'Modify Payment Reminder' : 'Add Payment Reminder'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-900 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {services.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400 space-y-3">
                  <p>You must create a service in Settings first before adding reminders.</p>
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
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Associated Service *</label>
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">To Pay Date *</label>
                      <input
                        type="date"
                        value={toPayDate}
                        onChange={(e) => setToPayDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Notify Before Pay Date (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={notifyDaysBefore}
                        onChange={(e) => setNotifyDaysBefore(parseInt(e.target.value) || 3)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Amount to Pay *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1500.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Currency *</label>
                      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 h-[42px] items-center">
                        <button
                          type="button"
                          onClick={() => setCurrency('USD')}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                            currency === 'USD' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          USD
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency('NPR')}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                            currency === 'NPR' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          NPR
                        </button>
                      </div>
                    </div>
                  </div>

                  {editingId && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Billing Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm bg-dark-900"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  )}

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
                      {editingId ? 'Save Changes' : 'Schedule Reminder'}
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
