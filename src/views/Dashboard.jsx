import { useDashboard } from '../controllers/useDashboard.js';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CalendarClock,
  CreditCard,
  Key,
  Mail,
  Server,
  ShieldAlert,
  TrendingUp,
  Users
} from 'lucide-react';

export default function Dashboard({ onTabChange }) {
  const { stats, recentExpiries, recentReminders } = useDashboard();

  const urgentCount = stats.expiringSoon + stats.pendingReminders;

  const kpiCards = [
    { id: 'customers', label: 'Clients Monitored', value: stats.customers, icon: Users, accent: 'amber', actionLabel: 'Manage clients', actionTab: 'expiry' },
    { id: 'expiring', label: 'Expiring Soon', value: stats.expiringSoon, icon: AlertTriangle, accent: stats.expiringSoon > 0 ? 'amber' : 'slate', actionLabel: 'View warnings', actionTab: 'expiry', pulse: stats.expiringSoon > 0 },
    { id: 'payments', label: 'Pending Dues', value: stats.pendingReminders, icon: CreditCard, accent: 'sky', actionLabel: 'Send reminders', actionTab: 'payment' },
    { id: 'passwords', label: 'Stored Vault Keys', value: stats.passwords, icon: Key, accent: 'emerald', actionLabel: 'Unlock vault', actionTab: 'password' }
  ];

  // Per-card accent system: each KPI gets its own color identity.
  const accentMap = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/20', bar: 'bg-amber-400', glow: 'shadow-amber-500/10' },
    sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', ring: 'ring-sky-500/20', bar: 'bg-sky-400', glow: 'shadow-sky-500/10' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/20', bar: 'bg-emerald-400', glow: 'shadow-emerald-500/10' },
    slate: { bg: 'bg-slate-800/40', border: 'border-slate-700/40', text: 'text-slate-400', ring: 'ring-slate-500/10', bar: 'bg-slate-500', glow: '' }
  };

  const daysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = new Date(dateStr) - today;
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="animate-slide-up flex flex-col min-h-[calc(100vh-12rem)] gap-6">

      {/* Hero Header */}
      <div className="relative overflow-hidden p-8 glass-panel rounded-3xl border border-white/5">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-rose-500/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Control Center</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Overview</h1>
            <p className="mt-1.5 text-sm text-slate-400 max-w-xl">
              Track clients, expiring services, pending dues, and vault health in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                {urgentCount} urgent item{urgentCount !== 1 ? 's' : ''} needs attention
              </div>
            )}
            <button
              onClick={() => onTabChange('settings')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:border-amber-500/30 hover:text-amber-400 transition-all duration-200"
            >
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const a = accentMap[card.accent] || accentMap.slate;
          const valueColor = card.pulse ? 'text-amber-400 animate-pulse' : 'text-white';
          return (
            <button
              key={card.id}
              onClick={() => onTabChange(card.actionTab)}
              className={`text-left glass-panel p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-xl ${a.glow} group cursor-pointer relative overflow-hidden`}
            >
              <span className={`absolute top-0 left-0 right-0 h-0.5 ${a.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${a.bg} border ${a.border} ${a.text} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {card.actionLabel} <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
              <h3 className={`text-4xl font-black mt-1 ${valueColor} tabular-nums`}>{card.value}</h3>
            </button>
          );
        })}
      </div>

      {/* Quick Action Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Email & SMTP', icon: Mail, tab: 'smtp', accent: 'text-violet-400', border: 'hover:border-violet-500/30' },
          { label: 'Expiry Control', icon: CalendarClock, tab: 'expiry', accent: 'text-amber-400', border: 'hover:border-amber-500/30' },
          { label: 'Payment Reminders', icon: CreditCard, tab: 'payment', accent: 'text-sky-400', border: 'hover:border-sky-500/30' },
          { label: 'Password Vault', icon: Key, tab: 'password', accent: 'text-emerald-400', border: 'hover:border-emerald-500/30' }
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              onClick={() => onTabChange(action.tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-300 text-sm font-semibold transition-all duration-200 hover:bg-white/5 ${action.border} hover:text-white hover:-translate-y-0.5 cursor-pointer`}
            >
              <Icon className={`w-4 h-4 ${action.accent}`} />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6 flex-1">

        {/* Expiries Panel */}
        <div className="col-span-2 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col transition-all duration-300 hover:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Expiry Timeline
            </h3>
            <button
              onClick={() => onTabChange('expiry')}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentExpiries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500">No upcoming service expirations.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {recentExpiries.map((c) => {
                const days = daysUntil(c.expiry_date);
                const status = days < 0 ? 'expired' : days <= c.notify_before_days ? 'warning' : 'active';
                const tone = status === 'expired' ? 'rose' : status === 'warning' ? 'amber' : 'emerald';
                const toneCls = tone === 'rose' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : tone === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                return (
                  <div
                    key={c.id}
                    onClick={() => onTabChange('expiry')}
                    className="flex items-center justify-between text-xs p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${toneCls}`}>
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{c.cname}</p>
                        <p className="text-[10px] text-slate-500">Expires {c.expiry_date} &bull; {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status === 'expired' ? 'badge-expired' : status === 'warning' ? 'badge-warning' : 'badge-active'}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payments Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col transition-all duration-300 hover:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Unpaid Invoices
            </h3>
            <button
              onClick={() => onTabChange('payment')}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentReminders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500">No outstanding invoices.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {recentReminders.map((r) => {
                const days = daysUntil(r.to_pay_date);
                return (
                  <div
                    key={r.id}
                    onClick={() => onTabChange('payment')}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{r.customer_name}</span>
                      <span className="font-bold text-slate-100 font-mono text-xs tabular-nums">
                        {r.currency === 'USD' ? `$${parseFloat(r.amount).toFixed(2)}` : `Rs. ${parseFloat(r.amount).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Due {r.to_pay_date}
                        {days < 0 && <span className="ml-1 text-rose-400 font-semibold">({Math.abs(days)} days overdue)</span>}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${r.status === 'overdue' ? 'badge-expired' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}