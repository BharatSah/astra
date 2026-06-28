import { useState } from 'react';
import { usePayments } from '../controllers/usePayments.js';
import { Plus, Edit2, Trash2, Mail, CheckCircle, X, DollarSign, Clock, Info } from 'lucide-react';

export default function PaymentReminders({ onNotify, onTriggerEmail, onTabChange }) {
  const {
    reminders, services, loading,
    saveReminder, removeReminder, markPaid, triggerReminderEmail
  } = usePayments({ notify: onNotify, triggerEmail: onTriggerEmail });

  const [activeTab, setActiveTab] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [toPayDate, setToPayDate] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('pending');
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);

  const handleOpenAddModal = () => {
    setEditingId(null); setCustomerName(''); setServiceId(services[0]?.id || '');
    setToPayDate(''); setAmount(''); setCurrency('USD'); setStatus('pending'); setNotifyDaysBefore(3);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (rem) => {
    setEditingId(rem.id); setCustomerName(rem.customer_name); setServiceId(rem.service_id || '');
    setToPayDate(rem.to_pay_date); setAmount(rem.amount.toString()); setCurrency(rem.currency);
    setStatus(rem.status); setNotifyDaysBefore(rem.notify_days_before);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !serviceId || !toPayDate || !amount) {
      onNotify('warning', 'Please fill in all required fields');
      return;
    }
    const payload = {
      customer_name: customerName, service_id: serviceId, to_pay_date: toPayDate,
      amount: parseFloat(amount), currency, notify_days_before: parseInt(notifyDaysBefore) || 3
    };
    const ok = await saveReminder({ editingId, status, ...payload });
    if (ok) setIsModalOpen(false);
  };

  const handleDelete = async (id) => { await removeReminder(id); };
  const handleMarkAsPaid = async (rem) => { await markPaid(rem); };
  const handleTriggerReminderEmail = (rem) => { triggerReminderEmail(rem); };

  const filteredReminders = reminders.filter(rem => {
    if (activeTab === 'paid') return rem.status === 'paid';
    return rem.status !== 'paid';
  });

  const formatCurrency = (val, cur) => {
    if (cur === 'USD') return `$${parseFloat(val).toFixed(2)}`;
    return `Rs. ${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const statusBar = (s) => s === 'paid' ? 'bg-emerald-500' : s === 'overdue' ? 'bg-rose-500' : 'bg-sky-500';

  return (
    <div className="animate-slide-up flex flex-col h-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/80 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">Billing Reminders</span>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
          Billing Reminders <span className="text-slate-500 text-base font-semibold ml-1">({reminders.length} total)</span>
        </h1>
      </div>

      {/* Compact Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-1 flex shrink-0">
            <button onClick={() => setActiveTab('active')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'active' ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}>
              Active Receivables
            </button>
            <button onClick={() => setActiveTab('paid')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'paid' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}>
              Settled / Paid
            </button>
          </div>
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition duration-200 shrink-0 sm:w-auto w-full justify-center shimmer-btn">
          <Plus className="w-4 h-4" />
          Add Reminder
        </button>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-500"></div>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 flex-1 flex flex-col items-center justify-center">
          <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No payment reminders scheduled here.</p>
          <button onClick={handleOpenAddModal} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition">
            Create first payment reminder &rarr;
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Pay Date</th>
                  <th className="p-4">Amount Due</th>
                  <th className="p-4">Rule Settings</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReminders.map((rem) => {
                  const serv = services.find(s => s.id === rem.service_id);
                  const payDate = new Date(rem.to_pay_date);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const daysLeft = Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  return (
                    <tr key={rem.id} className="hover:bg-white/[0.03] transition group">
                      <td className="p-4 relative">
                        <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${statusBar(rem.status)}`} />
                        <div className="font-bold text-slate-200">{rem.customer_name}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs border border-white/10 font-medium">
                          {serv ? serv.name : 'Unknown Service'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">
                          {new Date(rem.to_pay_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        {rem.status !== 'paid' && (
                          <div className={`text-xs mt-1 font-medium tabular-nums ${daysLeft < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-100 font-mono tabular-nums">
                        {formatCurrency(rem.amount, rem.currency)}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          Remind {rem.notify_days_before} days before
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${rem.status === 'paid' ? 'badge-active' : rem.status === 'overdue' ? 'badge-expired' : 'badge-warning'}`}>
                          {rem.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {rem.status !== 'paid' && (
                            <>
                              <button onClick={() => handleMarkAsPaid(rem)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition" title="Mark as Paid">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleTriggerReminderEmail(rem)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition" title="Send Email Reminder">
                                <Mail className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleOpenEditModal(rem)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition" title="Edit Reminder">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(rem.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition" title="Delete Reminder">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-slide-up">
          <div className="w-full max-w-2xl glass-panel border border-white/10 rounded-2xl shadow-2xl shadow-sky-500/5 flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                  {editingId ? <Edit2 className="w-5 h-5 text-white" /> : <DollarSign className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Reminder' : 'Add Reminder'}</h2>
                  <p className="text-xs text-slate-400">{editingId ? 'Update payment reminder details.' : 'Schedule a new invoice reminder.'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {services.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-600">
                    <Info className="w-7 h-7" />
                  </div>
                  <p>You must create a service in Settings first.</p>
                  <button onClick={() => { setIsModalOpen(false); onTabChange?.('settings'); }} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer">
                    Go to Settings
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Customer Name <span className="text-rose-500">*</span></label>
                      <input type="text" placeholder="e.g. Acme Corp" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Service <span className="text-rose-500">*</span></label>
                      <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm bg-dark-900 cursor-pointer transition-all duration-200 focus:scale-[1.01]" required>
                        {services.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Due Date <span className="text-rose-500">*</span></label>
                      <input type="date" value={toPayDate} onChange={(e) => setToPayDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Notify Before <span className="text-rose-500">*</span></label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="30" value={notifyDaysBefore} onChange={(e) => setNotifyDaysBefore(parseInt(e.target.value) || 3)} className="w-full px-4 py-3 rounded-xl text-center text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                        <span className="text-xs text-slate-500 font-semibold">days</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Amount <span className="text-rose-500">*</span></label>
                      <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm font-mono tabular-nums transition-all duration-200 focus:scale-[1.01]" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Currency</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm bg-dark-900 cursor-pointer transition-all duration-200 focus:scale-[1.01]">
                        <option value="USD">USD ($)</option>
                        <option value="NPR">NPR (Rs.)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'pending', label: 'Pending', color: 'amber' },
                        { value: 'paid', label: 'Paid', color: 'emerald' },
                        { value: 'overdue', label: 'Overdue', color: 'rose' }
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setStatus(opt.value)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${status === opt.value ? `bg-${opt.color}-500/20 border-${opt.color}-500/40 text-${opt.color}-300` : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">Pending/overdue status is recalculated automatically based on the due date.</p>
                  </div>

                  <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 text-sm">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all duration-200 font-semibold cursor-pointer">Cancel</button>
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 rounded-xl text-white font-bold transition-all duration-200 shadow-lg shadow-sky-500/10 shimmer-btn cursor-pointer">
                      {editingId ? 'Update Reminder' : 'Save Reminder'}
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