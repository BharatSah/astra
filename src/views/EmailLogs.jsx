import { useState } from 'react';
import { Mail, Search, ChevronDown, CheckCircle2, Eye, X, Clock, Send, Server, FileText } from 'lucide-react';

export default function EmailLogs({ emailLogs }) {
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
          <div className="flex items-center gap-2 mb-1.5"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">Email Logs</span></div><h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
            Send History <span className="text-slate-500 text-base font-semibold ml-1">({emailLogs.length} total)</span>
          </h1>
        </div>
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
      <div className="glass-panel rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col">
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
              <thead className="sticky top-0 bg-white/[0.03] border-b border-white/5 text-[11px] uppercase font-bold tracking-wider text-slate-400 z-10">
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
              <tbody className="divide-y divide-white/5">
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
                      <span className="inline-flex px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[11px] tracking-wide">
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
          <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl shadow-rose-500/5 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">Email Log Details</h3>
                  <p className="text-[11px] text-slate-500">Dispatch record &amp; message preview</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {!showPreview ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Customer</span>
                    </div>
                    <div className="text-sm font-bold text-slate-100">{selectedLog.recipient.split('@')[0]}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Send className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Email</span>
                    </div>
                    <div className="text-sm text-slate-200 truncate">{selectedLog.recipient}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Server className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Product</span>
                    </div>
                    <div className="text-sm text-slate-200 truncate">{getProductFromLog(selectedLog)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Template</span>
                    </div>
                    <div className="text-sm text-slate-200">{getTemplateFromLog(selectedLog)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Type</span>
                    </div>
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[11px] tracking-wide">
                      {selectedLog.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      sent
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Server className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Triggered By</span>
                    </div>
                    <div className="text-sm text-slate-200">System Automations</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Time</span>
                    </div>
                    <div className="text-sm text-slate-200">{formatTime(selectedLog.sent_at)}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/5 overflow-hidden bg-dark-950/60 max-h-[50vh] flex flex-col">
                    {/* Faux mail client chrome */}
                    <div className="bg-white/[0.03] px-4 py-3 border-b border-white/5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                      <span className="ml-2 text-[10px] text-slate-500 font-mono tracking-wide">astra-mail · delivered</span>
                    </div>
                    <div className="bg-white/[0.02] px-4 py-3 border-b border-white/5">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider mb-0.5">Subject</span>
                      <h4 className="text-sm font-bold text-slate-100">{selectedLog.subject}</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                      <pre className="text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {selectedLog.body}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition text-sm font-semibold border border-white/10"
              >
                Close
              </button>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 rounded-xl text-white font-semibold text-sm transition shadow-lg shadow-rose-500/20"
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
