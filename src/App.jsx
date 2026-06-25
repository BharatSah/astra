import { useState, useEffect } from 'react';
import { supabase, isFallbackMode } from './supabaseClient';
import { isImageUrl } from './cloudinary';
import Dashboard from './components/Dashboard';
import ExpiryManagement from './components/ExpiryManagement';
import PasswordManagement from './components/PasswordManagement';
import PaymentReminders from './components/PaymentReminders';
import EmailLogs from './components/EmailLogs';
import SmtpConfig from './components/SmtpConfig';
import Settings from './components/Settings';
import { 
  LayoutDashboard, 
  CalendarClock, 
  KeyRound, 
  Settings as SettingsIcon, 
  Mail, 
  X,
  ChevronDown,
  DollarSign,
  Send,
  LogOut
} from 'lucide-react';
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('services');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [notifications, setNotifications] = useState([]);
  const isTestMode = import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('test=true');

  // SMTP Simulation logs
  const [emailLogs, setEmailLogs] = useState([]);

  const DEFAULT_USER = {
    username: 'bharat.shah',
    email: 'bharat.shah@mithilacoders.com',
    avatar: 'B',
    role: 'Administrator'
  };

  const [authLoading, setAuthLoading] = useState(!isFallbackMode && !isTestMode);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (isTestMode) return true;
    if (!isFallbackMode) return false;
    return localStorage.getItem('astra_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('astra_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  const getUserFromSession = (user) => {
    const email = user?.email || DEFAULT_USER.email;
    const metadata = user?.user_metadata || {};
    const appMetadata = user?.app_metadata || {};
    const username = metadata.username || metadata.name || email.split('@')[0] || DEFAULT_USER.username;
    const avatar = metadata.avatar_url || metadata.avatar || username.charAt(0).toUpperCase();

    return {
      username,
      email,
      avatar,
      role: appMetadata.role || metadata.role || DEFAULT_USER.role
    };
  };

  const handleUpdateUser = (newDetails) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...newDetails };
      localStorage.setItem('astra_user', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (isFallbackMode || isTestMode) {
      setAuthLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Supabase session check failed:', error.message);
        setIsLoggedIn(false);
      } else {
        const session = data?.session;
        setIsLoggedIn(Boolean(session));
        if (session?.user) setCurrentUser(getUserFromSession(session.user));
      }
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      if (session?.user) {
        setCurrentUser(getUserFromSession(session.user));
      }
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestMode]);

  const handleLogout = async () => {
    if (!isFallbackMode && !isTestMode) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleNotify('error', error.message);
        return;
      }
    }
    setIsLoggedIn(false);
    localStorage.removeItem('astra_logged_in');
    handleNotify('success', 'Logged out successfully');
  };

  const handleLogin = async (email, password) => {
    if (!isFallbackMode && !isTestMode) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data?.user) setCurrentUser(getUserFromSession(data.user));
      setIsLoggedIn(true);
      return;
    }

    setIsLoggedIn(true);
    localStorage.setItem('astra_logged_in', 'true');
    const namePart = email.split('@')[0];
    const username = namePart.includes('.') ? namePart : namePart;
    const initial = username.charAt(0).toUpperCase();
    handleUpdateUser({
      username: username,
      email: email,
      avatar: initial
    });
  };

  const emailsSentToday = emailLogs.filter(log => {
    const logDate = new Date(log.sent_at).toDateString();
    const todayDate = new Date().toDateString();
    return logDate === todayDate;
  }).length;

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
    setEmailLogs(prev => {
      const updatedLogs = [newLog, ...prev];
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
      return updatedLogs;
    });

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
      case 'smtp':
        return <SmtpConfig onNotify={handleNotify} />;
      case 'emaillogs':
        return <EmailLogs emailLogs={emailLogs} />;
      case 'settings':
        return (
          <Settings 
            onNotify={handleNotify} 
            activeSubTab={activeSettingsTab} 
            onSubTabChange={setActiveSettingsTab}
            currentUser={currentUser}
            setCurrentUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        );
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expiry', label: 'Expiry Control', icon: CalendarClock },
    { id: 'password', label: 'Password Vault', icon: KeyRound },
    { id: 'payment', label: 'Billing Reminders', icon: DollarSign },
    { id: 'smtp', label: 'Email & SMTP Config', icon: Send },
    { id: 'emaillogs', label: 'Email Logs', icon: Mail },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon }
  ];

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} onNotify={handleNotify} authLoading={authLoading} />;
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-950 p-6 flex flex-col justify-between transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="space-y-8">
          {/* Logo / Branding */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <AstraLogo className="h-9 w-9" />
              <div>
                <span className="text-lg font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  Astra
                </span>
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
              
              if (item.id === 'settings') {
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setIsSettingsExpanded(!isSettingsExpanded);
                        if (!isActive) {
                          setActiveTab('settings');
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-brand-600/25 to-indigo-600/10 text-brand-400 border border-brand-500/20' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                        {item.label}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isSettingsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isSettingsExpanded && (
                      <div className="pl-12 pr-4 space-y-1 mt-1">
                        {[
                          { id: 'services', label: 'Service Catalog' },
                          { id: 'platforms', label: 'Platform Registry' },
                          { id: 'profile', label: 'User Profile' }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveTab('settings');
                              setActiveSettingsTab(sub.id);
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              isActive && activeSettingsTab === sub.id 
                                ? 'bg-slate-800 text-brand-400' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

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

        {/* Sidebar user profile footer */}
        <div className="pt-4 border-t border-slate-900/80 mt-auto space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-850/60">
            <div className="flex items-center gap-3 truncate">
              {isImageUrl(currentUser.avatar) ? (
                <img 
                  src={currentUser.avatar} 
                  alt={`${currentUser.username}'s avatar`} 
                  className="h-10 w-10 rounded-full object-cover shrink-0 shadow-md shadow-brand-500/20 border border-white/10" 
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white shrink-0 shadow-md shadow-brand-500/20">
                  {currentUser.avatar || 'B'}
                </div>
              )}
              <div className="truncate">
                <span className="text-sm font-bold text-slate-200 block truncate">{currentUser.username}</span>
                <span className="text-[10px] text-slate-400 block truncate" title={currentUser.email}>{currentUser.email}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-850 rounded-xl transition duration-200 shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          {/* Sent emails indicator pill */}
          <div className="flex items-center gap-2 bg-slate-900/30 border border-slate-850/40 px-3 py-2 rounded-xl text-xs font-semibold text-brand-400">
            <Mail className="w-3.5 h-3.5 text-brand-400" />
            <span>{emailsSentToday} email{emailsSentToday !== 1 ? 's' : ''} sent today</span>
          </div>
          
          <p className="text-[9px] text-slate-600 text-center">Version 1.0.0 (c) Astra</p>
        </div>
      </aside>

      {/* Main Panel layout container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-dark-950">

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

    </div>
  );
}

function Login({ onLogin, onNotify, authLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      onNotify('warning', 'Please fill in all credentials');
      return;
    }
    setLoading(true);
    try {
      await onLogin(email, password);
      onNotify('success', 'Welcome back!');
    } catch (error) {
      onNotify('error', error?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-dark-950 px-4">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent_40%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,189,248,0.12),transparent_40%)]"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl shadow-brand-500/5 animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <AstraLogo className="h-14 w-14 mb-4" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Astra</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500" />
              <span>Remember me</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); onNotify('info', 'Contact system admin to reset credentials.'); }} className="text-brand-400 hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-brand-500/10 shimmer-btn cursor-pointer mt-4 flex items-center justify-center gap-2"
          >
            {loading || authLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function AstraLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 78 L42 22 C43.5 19 46.5 19 48 22 L58 42 L34 68 C31 71.5 25 72 20 68 L15 78 Z" fill="url(#blueGrad)" />
      <path d="M15 78 C17.5 81.5 24 81 28 78 L52 50 L42 50 L15 78 Z" fill="url(#cyanGrad)" />
      <path d="M44 46 L54 22 C55.5 19 58.5 19 60 22 L83 72 C85.5 77 81.5 82 76 82 H62 L44 46 Z" fill="url(#purpleGrad)" />
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00c6ff" />
          <stop offset="100%" stopColor="#0072ff" />
        </linearGradient>
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#4facfe" />
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b155ff" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
