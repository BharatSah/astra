import { useState, useEffect } from 'react';
import { supabase, isFallbackMode } from './supabaseClient';
import Dashboard from './components/Dashboard';
import ExpiryManagement from './components/ExpiryManagement';
import PasswordManagement from './components/PasswordManagement';
import PaymentReminders from './components/PaymentReminders';
import Settings from './components/Settings';
import { 
  LayoutDashboard, 
  CalendarClock, 
  KeyRound, 
  CreditCard, 
  Settings as SettingsIcon, 
  Mail, 
  Bell, 
  Database,
  Menu,
  X,
  Trash2,
  Inbox
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [notifications, setNotifications] = useState([]);
  
  // SMTP Simulation logs
  const [emailLogs, setEmailLogs] = useState([]);
  const [isMailDrawerOpen, setIsMailDrawerOpen] = useState(false);
  const [hasUnreadMail, setHasUnreadMail] = useState(false);

  useEffect(() => {
    // Load initial mock mail list from local db if any
    const savedDb = localStorage.getItem('astra_db');
    if (savedDb) {
      try {
        const parsed = JSON.parse(savedDb);
        if (parsed.email_logs) {
          setEmailLogs(parsed.email_logs);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Show customized toasts
  const handleNotify = (type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Automatically clear toast after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Trigger simulated Gmail SMTP email send
  const handleTriggerEmail = async (emailObj) => {
    const timestamp = new Date().toISOString();
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      sent_at: timestamp,
      status: 'sent',
      ...emailObj
    };

    // Save locally
    const updatedLogs = [newLog, ...emailLogs];
    setEmailLogs(updatedLogs);
    setHasUnreadMail(true);

    const savedDb = localStorage.getItem('astra_db');
    if (savedDb) {
      try {
        const parsed = JSON.parse(savedDb);
        parsed.email_logs = updatedLogs;
        localStorage.setItem('astra_db', JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }

    // Try to sync with Supabase if online
    if (!isFallbackMode) {
      try {
        await supabase.from('email_logs').insert({
          recipient: emailObj.recipient,
          subject: emailObj.subject,
          body: emailObj.body,
          status: 'sent'
        });
      } catch (e) {
        console.warn('Supabase email logs sync failed, running in fallback local:', e.message);
      }
    }

    handleNotify('success', `SMTP Alert dispatched to ${emailObj.recipient}!`);
  };

  const handleClearEmailLogs = () => {
    setEmailLogs([]);
    setHasUnreadMail(false);
    const savedDb = localStorage.getItem('astra_db');
    if (savedDb) {
      try {
        const parsed = JSON.parse(savedDb);
        parsed.email_logs = [];
        localStorage.setItem('astra_db', JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }
    handleNotify('success', 'Email logs cleared');
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'expiry':
        return <ExpiryManagement onNotify={handleNotify} onTriggerEmail={handleTriggerEmail} />;
      case 'password':
        return <PasswordManagement onNotify={handleNotify} />;
      case 'payment':
        return <PaymentReminders onNotify={handleNotify} onTriggerEmail={handleTriggerEmail} />;
      case 'settings':
        return <Settings onNotify={handleNotify} />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expiry', label: 'Expiry Control', icon: CalendarClock },
    { id: 'password', label: 'Password Vault', icon: KeyRound },
    { id: 'payment', label: 'Billing Reminders', icon: CreditCard },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex relative">
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-950 border-r border-slate-850 p-6 flex flex-col justify-between transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="space-y-8">
          {/* Logo / Branding */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/25">
                <span className="text-xl font-black text-white">A</span>
                {/* Spinning border effect */}
                <div className="absolute inset-0 rounded-2xl border border-brand-400/30 animate-pulse-slow"></div>
              </div>
              <div>
                <span className="text-lg font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  Project Astra
                </span>
                <p className="text-[10px] text-brand-400 font-bold tracking-widest mt-0.5">VAULT & SYSTEM</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 lg:hidden"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Close sidebar on mobile
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-600/25 to-indigo-600/10 text-brand-400 border border-brand-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database indicator in sidebar footer */}
        <div className="space-y-4 pt-4 border-t border-slate-900">
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
            <Database className={`w-4 h-4 ${isFallbackMode ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Database Sync</span>
              <span className="text-xs font-semibold text-slate-300">
                {isFallbackMode ? 'Local Sandbox' : 'Supabase Connected'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 text-center">Version 1.0.0 © Project Astra</p>
        </div>
      </aside>

      {/* Main Panel layout container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-slate-850 flex items-center justify-between px-6 bg-dark-950/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500 hidden md:inline">
              Control Panel &gt; {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* SMTP simulated Inbox logs drawer trigger */}
            <button 
              onClick={() => {
                setIsMailDrawerOpen(true);
                setHasUnreadMail(false);
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl relative transition"
              title="SMTP Simulated Logs Drawer"
            >
              <Mail className="w-5 h-5" />
              {hasUnreadMail && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 animate-ping"></span>
              )}
            </button>

            {/* User notification indicators */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic page content scroll wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto pb-16">
          {isFallbackMode && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-center gap-2.5 animate-slide-up">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Running in Sandbox Mode (localStorage). Connect your Supabase credentials in settings to persist data to the cloud.</span>
            </div>
          )}
          
          {renderActiveComponent()}
        </main>
      </div>

      {/* Global Notifications system toasts wrapper */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`p-4 rounded-xl border shadow-xl flex justify-between items-start animate-slide-up ${
              notif.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300' 
                : notif.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/20 text-rose-300'
                  : 'bg-amber-950/80 border-amber-500/20 text-amber-300'
            }`}
          >
            <p className="text-xs font-semibold">{notif.message}</p>
            <button 
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              className="text-slate-400 hover:text-white ml-2 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Sliding Simulated SMTP Logs Drawer */}
      {isMailDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
          {/* Backdrop exit handler */}
          <div className="flex-1" onClick={() => setIsMailDrawerOpen(false)}></div>
          
          {/* Drawer main panel */}
          <div className="w-full max-w-md bg-dark-950 border-l border-slate-850 h-full flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-brand-400" />
                  SMTP Mail Simulator
                </h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">Logs generated on billing alerts</p>
              </div>
              <button 
                onClick={() => setIsMailDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List scroll view */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {emailLogs.length === 0 ? (
                <div className="text-center py-24 text-slate-500 space-y-3">
                  <Mail className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm">No outgoing SMTP emails logged.</p>
                  <p className="text-xs text-slate-600">Trigger warnings inside customer profiles or payment reminders to verify email templates.</p>
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>{new Date(log.sent_at).toLocaleTimeString()}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {log.type}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-300 font-bold">To: {log.recipient}</div>
                      <div className="text-xs text-slate-200 mt-1 font-semibold">{log.subject}</div>
                    </div>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <p className="text-[11px] text-slate-400 font-mono whitespace-pre-line leading-relaxed">
                      {log.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Drawer actions footer */}
            {emailLogs.length > 0 && (
              <div className="p-4 border-t border-slate-850 bg-slate-900/20 flex gap-4">
                <button
                  onClick={handleClearEmailLogs}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Email Logs
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
