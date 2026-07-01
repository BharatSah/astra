import { useState } from 'react';
import { Mail, Search, ChevronDown, CheckCircle2, Eye, X, Clock, Send, Server, FileText, XCircle } from 'lucide-react';

function DetailCell({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white/[0.03] border border-white/5 p-3 min-w-0 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-rose-400 shrink-0" />
        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 truncate">{label}</span>
      </div>
      <div className="text-xs sm:text-sm text-slate-200 min-w-0">{children}</div>
    </div>
  );
}

function EmailPreview({ log, formatTime }) {
  const recipient = log.recipient || '—';
  const recipientName = recipient.includes('@') ? recipient.split('@')[0] : recipient;

  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-dark-900 flex flex-col h-[min(52vh,420px)]">
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500/80" />
          <span className="w-2 h-2 rounded-full bg-amber-500/80" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-[10px] text-slate-500 font-mono tracking-wide">astra-mail · delivered</span>
        <div className="w-6" />
      </div>

      <div className="bg-slate-900/60 px-4 py-3 border-b border-slate-850 space-y-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-rose-600/25 text-rose-300 font-black text-xs flex items-center justify-center border border-rose-500/20 shrink-0">
            AN
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 truncate">Astra Notifications</span>
              <span className="text-[10px] text-slate-500 shrink-0">{formatTime(log.sent_at).split(',')[1]?.trim() || ''}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">From: &lt;notifications@astra.com&gt;</p>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-850 min-w-0">
          <span className="text-slate-500 font-bold shrink-0">To:</span>
          <span className="truncate text-slate-300 font-semibold">{recipient}</span>
        </div>
      </div>

      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-850 shrink-0">
        <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider mb-0.5">Subject</span>
        <h4 className="text-sm font-bold text-slate-100 leading-snug break-words">{log.subject || 'No subject'}</h4>
      </div>

      <div className="flex-1 min-h-0 bg-slate-950 p-4 overflow-y-auto overscroll-contain">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 sm:p-5 max-w-lg mx-auto shadow-inner">
          <p className="text-[10px] text-slate-500 mb-3">Dear {recipientName},</p>
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words font-sans">
            {log.body || <span className="text-slate-500 italic">Empty message body</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailLogs({ emailLogs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const getProductFromLog = (log) => log.subject || 'System Notification';

  const getTemplateFromLog = (log) => {
    const type = (log.type || '').toLowerCase();
    if (type.includes('expir')) return 'Expiry Email Template';
    if (type.includes('payment')) return 'Billing Reminder Template';
    return 'System Email Template';
  };

  const formatLogType = (log) => (log.type || 'notification').replace(/_/g, ' ');

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowPreview(false);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
    setShowPreview(false);
  };

  const filteredLogs = emailLogs.filter(log => {
    const recipient = (log.recipient || '').toLowerCase();
    const subject = (log.subject || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return recipient.includes(term) || subject.includes(term);
  });

  const recipientLabel = (log) => (log.recipient || 'unknown').split('@')[0];

  return (
    <div className="animate-slide-up flex flex-col min-h-[calc(100vh-7rem)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">Email Logs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Send History{' '}
            <span className="text-slate-500 text-sm sm:text-base font-semibold">({emailLogs.length} total)</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search recipient or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-slate-200 bg-slate-800/50 border border-slate-700/50 focus:border-brand-500/50 focus:bg-slate-800 transition-colors text-sm"
          />
        </div>
        <div className="relative w-full sm:w-44 shrink-0">
          <select className="w-full px-4 pr-8 py-2.5 rounded-xl text-slate-400 bg-slate-800/50 border border-slate-700/50 appearance-none text-sm focus:outline-none focus:border-brand-500/50">
            <option>All Time</option>
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col min-h-[280px]">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 sm:py-24 text-slate-500 flex flex-col items-center justify-center flex-1 px-4 space-y-4">
            <Mail className="w-12 h-12 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-400">No outgoing SMTP emails logged.</p>
              <p className="text-xs text-slate-500 mt-1">Trigger warnings or payment reminders to verify templates.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 overscroll-x-contain">
            <table className="w-full text-left border-collapse min-w-[640px] lg:min-w-[900px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/5 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-slate-400 z-10">
                <tr>
                  <th className="p-3 sm:p-4 pl-4 sm:pl-6 whitespace-nowrap">Time</th>
                  <th className="p-3 sm:p-4 hidden sm:table-cell">Customer</th>
                  <th className="p-3 sm:p-4">Email</th>
                  <th className="p-3 sm:p-4 hidden lg:table-cell">Product</th>
                  <th className="p-3 sm:p-4 hidden xl:table-cell">Template</th>
                  <th className="p-3 sm:p-4 text-center hidden md:table-cell">Type</th>
                  <th className="p-3 sm:p-4 pr-4 sm:pr-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleRowClick(log)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-[11px] sm:text-xs text-slate-400 whitespace-nowrap">{formatTime(log.sent_at)}</td>
                    <td className="p-3 sm:p-4 text-sm font-bold text-slate-200 hidden sm:table-cell">{recipientLabel(log)}</td>
                    <td className="p-3 sm:p-4 text-[11px] sm:text-xs text-slate-400 max-w-[140px] sm:max-w-none truncate">{log.recipient || '—'}</td>
                    <td className="p-3 sm:p-4 text-xs text-slate-400 max-w-[180px] truncate hidden lg:table-cell">{getProductFromLog(log)}</td>
                    <td className="p-3 sm:p-4 text-xs text-slate-400 hidden xl:table-cell">{getTemplateFromLog(log)}</td>
                    <td className="p-3 sm:p-4 text-center hidden md:table-cell">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[10px] tracking-wide">
                        {formatLogType(log)}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-center">
                      {log.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[10px] sm:text-xs border border-rose-500/20 px-1.5 sm:px-2 py-0.5 rounded-md" title={log.error || 'Send failed'}>
                          <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[10px] sm:text-xs border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          sent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-dark-950/85 backdrop-blur-sm p-0 sm:p-4"
          onClick={handleCloseModal}
        >
          <div
            className="glass-panel border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl shadow-rose-500/5 flex flex-col max-h-[92dvh] sm:max-h-[min(88vh,680px)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base truncate">
                    {showPreview ? 'Email Preview' : 'Email Log Details'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    {showPreview ? selectedLog.subject : 'Dispatch metadata'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
              {!showPreview ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 h-full content-start overflow-hidden">
                  <DetailCell icon={Mail} label="Customer">{recipientLabel(selectedLog)}</DetailCell>
                  <DetailCell icon={Send} label="Email">
                    <span className="truncate block" title={selectedLog.recipient}>{selectedLog.recipient || '—'}</span>
                  </DetailCell>
                  <DetailCell icon={Server} label="Product">
                    <span className="line-clamp-2">{getProductFromLog(selectedLog)}</span>
                  </DetailCell>
                  <DetailCell icon={FileText} label="Template">{getTemplateFromLog(selectedLog)}</DetailCell>
                  <DetailCell icon={Mail} label="Type">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold text-[10px]">
                      {formatLogType(selectedLog)}
                    </span>
                  </DetailCell>
                  <DetailCell icon={selectedLog.status === 'failed' ? XCircle : CheckCircle2} label="Status">
                    {selectedLog.status === 'failed' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[10px] sm:text-xs border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                          failed
                        </span>
                        {selectedLog.error && (
                          <p className="text-[10px] text-rose-300/80 mt-1.5 line-clamp-2" title={selectedLog.error}>{selectedLog.error}</p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[10px] sm:text-xs border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                        sent
                      </span>
                    )}
                  </DetailCell>
                  <DetailCell icon={Server} label="Triggered By">System</DetailCell>
                  <DetailCell icon={Clock} label="Time">
                    <span className="text-[11px] sm:text-xs leading-tight">{formatTime(selectedLog.sent_at)}</span>
                  </DetailCell>
                </div>
              ) : (
                <EmailPreview log={selectedLog} formatTime={formatTime} />
              )}
            </div>

            <div className="px-4 sm:px-5 py-4 border-t border-white/5 bg-white/[0.02] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-5 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition text-sm font-semibold border border-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 rounded-xl text-white font-semibold text-sm transition shadow-lg shadow-rose-500/20"
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
