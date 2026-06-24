import { useState } from 'react';
import { Mail, Trash2, Search, ChevronDown, CheckCircle2, Eye, X } from 'lucide-react';

export default function EmailLogs({ emailLogs, onClearLogs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Derive "Product" and "Template" from the log type or subject
  const getProductFromLog = (log) => {
    // We don't have product in our schema, so we fake it based on type or subject
    return log.subject || 'System Notification';
  };

  const getTemplateFromLog = (log) => {
    if (log.type === 'expiry_warning' || log.type === 'expiry_expired') return 'Expiry Email Template';
    if (log.type === 'payment_reminder') return 'Billing Reminder Template';
    return 'System Email Template';
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowPreview(false);
  };

  // filter
  const filteredLogs = emailLogs.filter(log => 
    log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-slide-up flex flex-col h-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 w-full">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
            Send History <span className="text-slate-400 text-base font-semibold ml-1">({emailLogs.length} total)</span>
          </h1>
        </div>
        {emailLogs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </button>
        )}
      </div>

      {/* Top filter bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-slate-200 bg-slate-800/50 border border-slate-700/50 focus:border-brand-500/50 focus:bg-slate-800 transition-colors text-sm"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <select className="w-full px-4 pr-8 py-2.5 rounded-xl text-slate-400 bg-slate-800/50 border border-slate-700/50 appearance-none text-sm focus:outline-none focus:border-brand-500/50">
            <option>All Time</option>
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800/60 bg-dark-900 flex-1 overflow-hidden flex flex-col">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-24 text-slate-500 flex flex-col items-center justify-center h-full space-y-4">
            <Mail className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-400">No outgoing SMTP emails logged.</p>
              <p className="text-xs text-slate-500 mt-1">Trigger warnings inside customer profiles or payment reminders to verify templates.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-dark-900 border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider text-slate-400 z-10">
                <tr>
                  <th className="p-4 pl-6 whitespace-nowrap">TIME</th>
                  <th className="p-4">CUSTOMER</th>
                  <th className="p-4">EMAIL</th>
                  <th className="p-4">PRODUCT</th>
                  <th className="p-4">TEMPLATE</th>
                  <th className="p-4 text-center">TYPE</th>
                  <th className="p-4 pr-6 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => handleRowClick(log)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 text-xs text-slate-400 whitespace-nowrap">{formatTime(log.sent_at)}</td>
                    <td className="p-4 text-sm font-bold text-slate-200">{log.recipient.split('@')[0]}</td>
                    <td className="p-4 text-xs text-slate-400">{log.recipient}</td>
                    <td className="p-4 text-xs text-slate-400 max-w-[200px] truncate">{getProductFromLog(log)}</td>
                    <td className="p-4 text-xs text-slate-400">{getTemplateFromLog(log)}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[11px] tracking-wide">
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        sent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-slate-100">Email Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {!showPreview ? (
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Customer</label>
                    <div className="text-sm font-bold text-slate-200">{selectedLog.recipient.split('@')[0]}</div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Email</label>
                    <div className="text-sm text-slate-300">{selectedLog.recipient}</div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Product</label>
                    <div className="text-sm text-slate-300">{getProductFromLog(selectedLog)}</div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Template</label>
                    <div className="text-sm text-slate-300">{getTemplateFromLog(selectedLog)}</div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Type</label>
                    <span className="inline-flex px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[11px] tracking-wide mt-1">
                      {selectedLog.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Status</label>
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-sm mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      sent
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Triggered By</label>
                    <div className="text-sm text-slate-300">System Automations</div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Time</label>
                    <div className="text-sm text-slate-300">{formatTime(selectedLog.sent_at)}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-dark-900 border border-slate-850 p-4 rounded-xl">
                    <div className="text-xs text-slate-400 mb-2">Subject: <span className="font-bold text-white">{selectedLog.subject}</span></div>
                    <div className="h-px bg-slate-800 w-full mb-3"></div>
                    <pre className="text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {selectedLog.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition text-sm font-semibold border border-slate-700"
              >
                Close
              </button>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-sm transition shadow-lg shadow-blue-500/20"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Back to Details' : 'Preview Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
