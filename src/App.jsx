import { useState } from 'react';
import { isSupabaseConfigured } from './models/dbClient.js';
import { isImageUrl } from './services/cloudinaryService.js';
import { useAuth } from './controllers/useAuth.js';
import { useNotifications } from './controllers/useNotifications.js';
import { useEmailDispatch } from './controllers/useEmailDispatch.js';
import Dashboard from './views/Dashboard.jsx';
import ExpiryManagement from './views/ExpiryManagement.jsx';
import PasswordManagement from './views/PasswordManagement.jsx';
import PaymentReminders from './views/PaymentReminders.jsx';
import EmailLogs from './views/EmailLogs.jsx';
import SmtpConfig from './views/SmtpConfig.jsx';
import Settings from './views/Settings.jsx';
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
  LogOut,
  ChevronRight,
  Server,
  Laptop,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

// Per-feature accent mapping drives the active-nav indicator color so each
// section reads as visually distinct while sharing one shell.
const ACCENTS = {
  dashboard: { ring: 'text-amber-400', bar: 'bg-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', border: 'border-amber-500/20', grad: 'from-amber-500/20 to-orange-500/5' },
  expiry: { ring: 'text-amber-400', bar: 'bg-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', border: 'border-amber-500/20', grad: 'from-amber-500/20 to-orange-500/5' },
  password: { ring: 'text-emerald-400', bar: 'bg-emerald-400', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', grad: 'from-emerald-500/20 to-teal-500/5' },
  payment: { ring: 'text-sky-400', bar: 'bg-sky-400', glow: 'shadow-sky-500/20', bg: 'bg-sky-500/10', border: 'border-sky-500/20', grad: 'from-sky-500/20 to-cyan-500/5' },
  smtp: { ring: 'text-violet-400', bar: 'bg-violet-400', glow: 'shadow-violet-500/20', bg: 'bg-violet-500/10', border: 'border-violet-500/20', grad: 'from-violet-500/20 to-fuchsia-500/5' },
  emaillogs: { ring: 'text-rose-400', bar: 'bg-rose-400', glow: 'shadow-rose-500/20', bg: 'bg-rose-500/10', border: 'border-rose-500/20', grad: 'from-rose-500/20 to-pink-500/5' },
  settings: { ring: 'text-slate-300', bar: 'bg-slate-300', glow: 'shadow-slate-500/20', bg: 'bg-slate-500/10', border: 'border-slate-500/20', grad: 'from-slate-500/15 to-slate-600/5' }
};

export default function App() {
  const { notifications, notify, dismiss } = useNotifications();
  const {
    authLoading,
    isLoggedIn,
    currentUser,
    updateUser,
    syncUserFromSession,
    login,
    logout,
    hasLoginPassword,
    setPassword,
    changePassword
  } = useAuth(notify);

  const sessionReady = isLoggedIn;
  const { triggerEmail, emailLogs } = useEmailDispatch(notify, sessionReady);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('services');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const emailsSentToday = emailLogs.filter(log => {
    const logDate = new Date(log.sent_at).toDateString();
    const todayDate = new Date().toDateString();
    return logDate === todayDate;
  }).length;
  const dailyEmailTarget = Math.max(10, emailsSentToday);
  const emailProgress = Math.min((emailsSentToday / dailyEmailTarget) * 100, 100);
  const emailStatus = emailsSentToday === 0 ? 'No sends yet' : `${emailsSentToday} sent`;

  const handleLogout = () => { logout(); };
  const handleLogin = async (email, password) => { await login(email, password); };
  const handleTabChange = (tab, subTab = null) => {
    setActiveTab(tab);
    if (tab === 'settings' && subTab) {
      setActiveSettingsTab(subTab);
      setIsSettingsExpanded(true);
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={handleTabChange} />;
      case 'expiry':
        return <ExpiryManagement onNotify={notify} onTriggerEmail={triggerEmail} onTabChange={handleTabChange} />;
      case 'password':
        return <PasswordManagement onNotify={notify} onTabChange={handleTabChange} />;
      case 'payment':
        return <PaymentReminders onNotify={notify} onTriggerEmail={triggerEmail} onTabChange={handleTabChange} />;
      case 'smtp':
        return <SmtpConfig onNotify={notify} />;
      case 'emaillogs':
        return <EmailLogs emailLogs={emailLogs} />;
      case 'settings':
        return (
          <Settings
            onNotify={notify}
            activeSubTab={activeSettingsTab}
            onSubTabChange={setActiveSettingsTab}
            currentUser={currentUser}
            setCurrentUser={updateUser}
            syncUserFromSession={syncUserFromSession}
            onLogout={handleLogout}
            hasPassword={hasLoginPassword}
            onSetPassword={setPassword}
            onChangePassword={changePassword}
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

  if (!isSupabaseConfigured) {
    return <SupabaseRequired />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950 gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
        <p className="text-sm text-slate-400">Restoring your session…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Login
        onNotify={notify}
        authLoading={authLoading}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="sticky top-0 h-screen w-64 shrink-0 bg-dark-950/80 backdrop-blur-xl pt-6 px-6 pb-0 flex flex-col border-r border-white/5">
        <div className="space-y-8 flex-1 min-h-0 overflow-y-auto">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <AstraLogo className="h-9 w-9" />
            <span className="text-lg font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500">
              Astra
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const accent = ACCENTS[item.id] || ACCENTS.settings;

              if (item.id === 'settings') {
                const subItems = [
                  { id: 'services', label: 'Service Catalog', icon: Server },
                  { id: 'platforms', label: 'Platform Registry', icon: Laptop },
                  { id: 'profile', label: 'User Profile', icon: User }
                ];
                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        setIsSettingsExpanded(!isSettingsExpanded);
                        if (!isActive) {
                          setActiveTab('settings');
                        }
                      }}
                      className={`group w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                        isActive
                          ? `bg-gradient-to-r ${accent.grad} text-white border ${accent.border}`
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {isActive && <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full ${accent.bar}`} />}
                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-4 h-4 ${isActive ? accent.ring : 'text-slate-400'}`} />
                        {item.label}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSettingsExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Vertical line tree for sub-pages - animated expand */}
                    <div
                      className={`grid transition-all duration-300 ease-out ${isSettingsExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="relative pl-6 pr-2 space-y-0.5">
                          {/* Continuous vertical connector line */}
                          <span className="absolute left-[26px] top-0 bottom-2 w-px bg-gradient-to-b from-white/15 via-white/10 to-transparent" />

                          {subItems.map((sub, idx) => {
                            const SubIcon = sub.icon;
                            const subActive = isActive && activeSettingsTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab('settings');
                                  setActiveSettingsTab(sub.id);
                                }}
                                style={{ animationDelay: `${idx * 50}ms` }}
                                className={`group/sub sub-fade-in relative w-full flex items-center gap-2.5 py-2 pr-3 pl-5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                  subActive
                                    ? 'text-amber-400 bg-amber-500/10'
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                }`}
                              >
                                {/* Arrow node sitting on the vertical line */}
                                <span className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ${subActive ? 'text-amber-400' : 'text-slate-600 group-hover/sub:text-slate-400'}`}>
                                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${subActive ? 'translate-x-0' : '-translate-x-0.5'}`} />
                                </span>
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${subActive ? 'text-amber-400' : 'text-slate-500 group-hover/sub:text-slate-300'}`} />
                                <span className="truncate">{sub.label}</span>
                                {subActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-r ${accent.grad} text-white border ${accent.border}`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {isActive && <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full ${accent.bar}`} />}
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? accent.ring : 'text-slate-400 group-hover:text-slate-300'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar user profile footer — full-bleed, flush with sidebar edges */}
        <div className="mt-auto shrink-0 -mx-6 border-t border-white/5">
          <div className="relative overflow-hidden bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {isImageUrl(currentUser.avatar) ? (
                  <img
                    src={currentUser.avatar}
                    alt={`${currentUser.username}'s avatar`}
                    className="h-10 w-10 rounded-xl object-cover shadow-md shadow-amber-500/20 border border-white/10"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center font-black text-white shadow-md shadow-amber-500/20">
                    {currentUser.avatar || 'B'}
                  </div>
                )}
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              </div>

              <div className="min-w-0 flex-1 pr-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="block truncate text-sm font-black text-slate-100">{currentUser.username}</span>
                </div>
                <span className="block truncate text-[10px] font-medium text-slate-400" title={currentUser.email}>{currentUser.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-500 transition duration-200 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 shrink-0 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Mail className="w-3 h-3 text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-0.5">
                  <span>Email limit</span>
                  <span>{emailStatus}</span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full border border-white/5 bg-dark-950/80"
                  role="progressbar"
                  aria-label="Emails sent today"
                  aria-valuenow={Math.round(emailProgress)}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${emailProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel layout container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden bg-dark-950">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 w-full max-w-[1600px] mx-auto pb-12">
          {renderActiveComponent()}
        </main>
      </div>

      {/* Global Notifications system toasts wrapper */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 w-full max-w-sm pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex justify-between items-start gap-2 animate-slide-up backdrop-blur-xl ${
              notif.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300'
                : notif.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/20 text-rose-300'
                  : 'bg-amber-950/80 border-amber-500/20 text-amber-300'
            }`}
          >
            <p className="text-xs font-semibold break-words min-w-0 flex-1">{notif.message}</p>
            <button
              onClick={() => dismiss(notif.id)}
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

function SupabaseRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-8">
      <div className="max-w-lg w-full glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
        <AstraLogo className="h-12 w-12 mx-auto" />
        <h1 className="text-xl font-bold text-white">Supabase connection required</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Astra runs entirely on Supabase. Add <code className="text-amber-400">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-amber-400">VITE_SUPABASE_ANON_KEY</code> to your <code className="text-slate-300">.env</code> file, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

function Login({ onNotify, authLoading, onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-dark-950 px-4 overflow-hidden">
      {/* Ambient layered background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.18),transparent_45%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.14),transparent_45%)]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl shadow-amber-500/5 animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <AstraLogo className="h-14 w-14 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Astra</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide uppercase">Security &amp; Expiry Control</p>
        </div>

        <PasswordLoginForm onLogin={onLogin} onNotify={onNotify} authLoading={authLoading} />
      </div>
    </div>
  );
}

function PasswordLoginForm({ onLogin, onNotify, authLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full pl-4 pr-11 py-3 rounded-xl text-slate-200 glass-input text-sm"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500" />
          <span>Remember me</span>
        </label>
        <a href="#" onClick={(e) => { e.preventDefault(); onNotify('info', 'Contact system admin to reset credentials.'); }} className="text-amber-400 hover:underline">Forgot password?</a>
      </div>

      <button
        type="submit"
        disabled={loading || authLoading}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 shimmer-btn cursor-pointer mt-4 flex items-center justify-center gap-2"
      >
        {loading || authLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

function AstraLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 78 L42 22 C43.5 19 46.5 19 48 22 L58 42 L34 68 C31 71.5 25 72 20 68 L15 78 Z" fill="url(#g1)" />
      <path d="M15 78 C17.5 81.5 24 81 28 78 L52 50 L42 50 L15 78 Z" fill="url(#g2)" />
      <path d="M44 46 L54 22 C55.5 19 58.5 19 60 22 L83 72 C85.5 77 81.5 82 76 82 H62 L44 46 Z" fill="url(#g3)" />
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
    </svg>
  );
}
