import { useState, useEffect } from 'react';
import { useExpiry } from '../controllers/useExpiry.js';
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

export default function ExpiryManagement({ onNotify, onTriggerEmail, onTabChange }) {
  const {
    customers, services,
    saveCustomer, removeCustomer, triggerWarning
  } = useExpiry({ notify: onNotify, triggerEmail: onTriggerEmail });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cname, setCname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [note, setNote] = useState('');
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(7);
  const [expiryDate, setExpiryDate] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (services.length > 0 && !serviceId) setServiceId(services[0].id);
  }, [services, serviceId]);

  const handleResetForm = () => {
    setEditingId(null); setCname(''); setEmail(''); setPhone('');
    setServiceId(services[0]?.id || ''); setNote('');
    setNotifyBeforeDays(7); setExpiryDate(''); setRecipientEmails('');
  };
  const handleOpenForm = () => { handleResetForm(); setIsFormOpen(true); };
  const handleCloseForm = () => { setIsFormOpen(false); handleResetForm(); };

  const handleLoadEdit = (cust) => {
    setEditingId(cust.id);
    setCname(cust.cname); setEmail(cust.email); setPhone(cust.phone || '');
    setServiceId(cust.service_id || ''); setNote(cust.note || '');
    setNotifyBeforeDays(cust.notify_before_days); setExpiryDate(cust.expiry_date);
    setRecipientEmails(cust.recipient_emails || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cname || !email || !expiryDate || !serviceId) {
      onNotify('warning', 'Please fill in all required fields');
      return;
    }
    const payload = {
      cname, email, phone, service_id: serviceId, note,
      notify_before_days: parseInt(notifyBeforeDays) || 7,
      expiry_date: expiryDate,
      recipient_emails: recipientEmails ? recipientEmails.trim() : ''
    };
    const ok = await saveCustomer({ editingId, ...payload });
    if (ok) handleCloseForm();
  };

  const handleDelete = async (id, name) => { await removeCustomer(id, name); };
  const handleTriggerWarning = (customer) => { triggerWarning(customer); };

  const filteredCustomers = customers.filter(cust => {
    const matchSearch =
      cust.cname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.note && cust.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'all' || cust.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Severity drives the left accent bar on each row.
  const severityBar = (status) =>
    status === 'expired' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500/50';

  return (
    <div className="animate-slide-up flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Expiry Control</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
            Expiry Control <span className="text-slate-500 text-base font-semibold ml-1">({filteredCustomers.length} total)</span>
          </h1>
        </div>
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition duration-200 shrink-0 sm:w-auto w-full justify-center shimmer-btn"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Full-Height Rules Table */}
      {filteredCustomers.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 flex-1 flex flex-col items-center justify-center">
          <Sliders className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No expiry rules found matching your criteria.</p>
          <button
            onClick={handleOpenForm}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
          >
            Create your first expiry rule &rarr;
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4">Send To</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredCustomers.map((cust) => {
                  const serv = services.find(s => s.id === cust.service_id);
                  const expiry = new Date(cust.expiry_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-white/[0.03] transition group relative ${editingId === cust.id ? 'bg-amber-500/5' : ''}`}
                    >
                      {/* Severity accent bar */}
                      <td className="p-4 relative">
                        <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${severityBar(cust.status)}`} />
                        <div className="font-bold text-slate-200 text-sm">{cust.cname}</div>
                        <div className="text-slate-400 mt-0.5">{cust.email}</div>
                        {cust.phone && <div className="text-slate-500 mt-0.5">{cust.phone}</div>}
                      </td>

                      <td className="p-4">
                        {serv && (
                          <span className="inline-block px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg border border-white/10 text-[11px] font-semibold">
                            {serv.name}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-200">
                          {expiry.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className={`mt-1 font-semibold tabular-nums ${daysRemaining <= 0 ? 'text-rose-400' : daysRemaining <= cust.notify_before_days ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {daysRemaining <= 0 ? `Expired ${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Alert: {cust.notify_before_days}d before</div>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-300 text-[11px] max-w-[160px] truncate" title={cust.recipient_emails || cust.email}>
                          {cust.recipient_emails || cust.email}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${cust.status === 'active' ? 'badge-active' : cust.status === 'warning' ? 'badge-warning' : 'badge-expired'}`}>
                          {cust.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTriggerWarning(cust)}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition duration-150"
                            title="Send Email Alert"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLoadEdit(cust)}
                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition duration-150"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id, cust.cname)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-150"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          <div className="w-full max-w-2xl glass-panel border border-white/10 rounded-2xl shadow-2xl shadow-amber-500/5 flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  {editingId ? <Edit2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Customer Rule' : 'Add Customer'}</h2>
                  <p className="text-xs text-slate-400">{editingId ? 'Update expiry rule details.' : 'Create a new client expiry and notification rule.'}</p>
                </div>
              </div>
              <button onClick={handleCloseForm} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {services.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-600">
                    <Info className="w-7 h-7" />
                  </div>
                  <p>You must configure services in System Settings first.</p>
                  <button onClick={() => { setIsFormOpen(false); onTabChange('settings'); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer">Go to Settings</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Customer Name <span className="text-rose-500">*</span></label>
                      <input type="text" placeholder="e.g. Acme Corp" value={cname} onChange={(e) => setCname(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email <span className="text-rose-500">*</span></label>
                      <input type="email" placeholder="admin@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label>
                      <input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" />
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Expiry Date <span className="text-rose-500">*</span></label>
                      <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Notify Before <span className="text-rose-500">*</span></label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="90" value={notifyBeforeDays} onChange={(e) => setNotifyBeforeDays(parseInt(e.target.value) || 7)} className="w-full px-4 py-3 rounded-xl text-center text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                        <span className="text-xs text-slate-500 font-semibold">days</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Send Mail To</label>
                    <input type="text" placeholder="e.g. admin@company.com, manager@company.com" value={recipientEmails} onChange={(e) => setRecipientEmails(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" />
                    <p className="mt-1.5 text-[11px] text-slate-500">Defaults to customer email if blank. Separate multiple emails with commas.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Note</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any extra details about this client or contract..." rows="3" className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm font-sans leading-relaxed resize-none transition-all duration-200 focus:scale-[1.01]" />
                  </div>

                  <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 text-sm">
                    <button type="button" onClick={handleCloseForm} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all duration-200 font-semibold cursor-pointer">Cancel</button>
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold transition-all duration-200 shadow-lg shadow-amber-500/10 shimmer-btn cursor-pointer">
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
