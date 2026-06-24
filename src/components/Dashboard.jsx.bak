import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Key, Users, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';

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
      // Fetch datasets
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

      // Calculate stats
      const today = new Date();
      today.setHours(0,0,0,0);

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

      // Filter upcoming expiries (next 15 days) and reminders
      const upcomingExps = custData
        .filter(c => {
          const diff = new Date(c.expiry_date) - today;
          const days = Math.ceil(diff / (1000 * 3600 * 24));
          return days <= 15;
        })
        .slice(0, 5);

      const upcomingRems = remData
        .filter(r => r.status !== 'paid')
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

  return (
    <div className="space-y-6 animate-slide-up flex flex-col min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
            Dashboard Overview
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between glass-card-glow-purple">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clients Monitored</p>
            <h3 className="text-3xl font-extrabold text-slate-100">{stats.customers}</h3>
            <button
              onClick={() => onTabChange('expiry')}
              className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-0.5 mt-2"
            >
              Manage clients <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 bg-brand-500/10 rounded-2xl border border-brand-500/20 text-brand-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between glass-card-glow-purple">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expiring Soon</p>
            <h3 className={`text-3xl font-extrabold ${stats.expiringSoon > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-100'}`}>
              {stats.expiringSoon}
            </h3>
            <button
              onClick={() => onTabChange('expiry')}
              className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-0.5 mt-2"
            >
              View warnings <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={`p-4 rounded-2xl border ${
            stats.expiringSoon > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Reminders */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between glass-card-glow-purple">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Dues</p>
            <h3 className="text-3xl font-extrabold text-slate-100">{stats.pendingReminders}</h3>
            <button
              onClick={() => onTabChange('payment')}
              className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-0.5 mt-2"
            >
              Remind clients <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Secure Passwords */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between glass-card-glow-purple">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Stored Vault Keys</p>
            <h3 className="text-3xl font-extrabold text-slate-100">{stats.passwords}</h3>
            <button
              onClick={() => onTabChange('password')}
              className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-0.5 mt-2"
            >
              Unlock vault <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <Key className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Expiries & Payments Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Expiries due */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex flex-col">
          <h3 className="font-bold text-base text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            Immediate Expiry Warnings (&lt;15 days)
          </h3>
          {recentExpiries.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 flex-1 flex items-center justify-center">No upcoming service expirations.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {recentExpiries.map(c => (
                <div key={c.id} className="flex justify-between items-center text-xs p-3 bg-dark-950/60 rounded-xl border border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">{c.cname}</span>
                    <span className="text-[10px] text-slate-500 ml-2">Expires: {c.expiry_date}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    c.status === 'expired' ? 'badge-expired' : 'badge-warning'
                  }`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments due */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex flex-col">
          <h3 className="font-bold text-base text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Unpaid Dues Timeline
          </h3>
          {recentReminders.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 flex-1 flex items-center justify-center">No outstanding client invoices due.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {recentReminders.map(r => (
                <div key={r.id} className="flex justify-between items-center text-xs p-3 bg-dark-950/60 rounded-xl border border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">{r.customer_name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">Due: {r.to_pay_date}</span>
                  </div>
                  <span className="font-bold text-slate-100 font-mono">
                    {r.currency === 'USD' ? `$${parseFloat(r.amount).toFixed(2)}` : `Rs. ${parseFloat(r.amount).toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
