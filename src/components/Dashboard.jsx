import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
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
  const [stats, setStats] = useState({
    customers: 0,
    services: 0,
    passwords: 0,
    pendingReminders: 0,
    expiringSoon: 0
  });
  const [recentExpiries, setRecentExpiries] = useState([]);
  const [recentReminders, setRecentReminders] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const customersRes = await supabase.from('customers').select('*');
      const servicesRes = await supabase.from('services').select('*');
      const passwordsRes = await supabase.from('passwords').select('*');
      const remindersRes = await supabase.from('payment_reminders').select('*');

      if (customersRes.error) throw customersRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (passwordsRes.error) throw passwordsRes.error;
      if (remindersRes.error) throw remindersRes.error;

      const custData = customersRes.data || [];
      const servData = servicesRes.data || [];
      const pwData = passwordsRes.data || [];
      const remData = remindersRes.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiring = custData.filter(c => {
        const diff = new Date(c.expiry_date) - today;
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days > 0 && days <= c.notify_before_days;
      }).length;

      const pending = remData.filter(r => r.status !== 'paid').length;

      setStats({
        customers: custData.length,
        services: servData.length,
        passwords: pwData.length,
        pendingReminders: pending,
        expiringSoon: expiring
      });

      const upcomingExps = custData
        .filter(c => {
          const diff = new Date(c.expiry_date) - today;
          const days = Math.ceil(diff / (1000 * 3600 * 24));
          return days <= 15;
        })
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        .slice(0, 5);

      const upcomingRems = remData
        .filter(r => r.status !== 'paid')
        .sort((a, b) => new Date(a.to_pay_date) - new Date(b.to_pay_date))
        .slice(0, 5);

      setRecentExpiries(upcomingExps);
      setRecentReminders(upcomingRems);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const urgentCount = stats.expiringSoon + stats.pendingReminders;

  const kpiCards = [
    {
      id: 'customers',
      label: 'Clients Monitored',
      value: stats.customers,
      icon: Users,
      color: 'brand',
      actionLabel: 'Manage clients',
      actionTab: 'expiry'
    },
    {
      id: 'expiring',
      label: 'Expiring Soon',
      value: stats.expiringSoon,
      icon: AlertTriangle,
      color: stats.expiringSoon > 0 ? 'amber' : 'slate',
      actionLabel: 'View warnings',
      actionTab: 'expiry',
      pulse: stats.expiringSoon > 0
    },
    {
      id: 'payments',
      label: 'Pending Dues',
      value: stats.pendingReminders,
      icon: CreditCard,
      color: 'indigo',
      actionLabel: 'Send reminders',
      actionTab: 'payment'
    },
    {
      id: 'passwords',
      label: 'Stored Vault Keys',
      value: stats.passwords,
      icon: Key,
      color: 'emerald',
      actionLabel: 'Unlock vault',
      actionTab: 'password'
    }
  ];

  const colorMap = {
    brand: { bg: 'bg-brand-500/10', border: 'border-brand-500/20', text: 'text-brand-400', glow: 'glass-card-glow-purple' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: '' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', glow: 'glass-card-glow-blue' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: '' },
    slate: { bg: 'bg-slate-900', border: 'border-slate-800', text: 'text-slate-400', glow: '' }
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
      <div className="relative overflow-hidden p-6 glass-panel rounded-2xl border border-slate-850">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-slate-400">
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:text-white transition-all duration-200"
            >
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const colors = colorMap[card.color];
          const valueColor = card.pulse ? 'text-amber-400 animate-pulse' : 'text-white';
          return (
            <button
              key={card.id}
              onClick={() => onTabChange(card.actionTab)}
              className={`text-left glass-panel p-5 rounded-2xl border border-slate-850 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5 group cursor-pointer ${colors.glow}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border} ${colors.text} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {card.actionLabel} <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
              <h3 className={`text-3xl font-extrabold mt-1 ${valueColor}`}>{card.value}</h3>
            </button>
          );
        })}
      </div>

      {/* Quick Action Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Email & SMTP', icon: Mail, tab: 'smtp' },
          { label: 'Expiry Control', icon: CalendarClock, tab: 'expiry' },
          { label: 'Payment Reminders', icon: CreditCard, tab: 'payment' },
          { label: 'Password Vault', icon: Key, tab: 'password' }
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.tab}
              onClick={() => onTabChange(action.tab)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-300 text-sm font-semibold transition-all duration-200 hover:bg-slate-800/60 hover:border-slate-700 hover:text-white hover:-translate-y-0.5 cursor-pointer"
            >
              <Icon className="w-4 h-4 text-brand-400" />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

        {/* Expiries Panel */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-850 flex flex-col transition-all duration-300 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              Expiry Timeline
            </h3>
            <button
              onClick={() => onTabChange('expiry')}
              className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-0.5 transition-colors"
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
                return (
                  <div
                    key={c.id}
                    onClick={() => onTabChange('expiry')}
                    className="flex items-center justify-between text-xs p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${status === 'expired' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
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
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex flex-col transition-all duration-300 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Unpaid Invoices
            </h3>
            <button
              onClick={() => onTabChange('payment')}
              className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-0.5 transition-colors"
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
                    className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{r.customer_name}</span>
                      <span className="font-bold text-slate-100 font-mono text-xs">
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
