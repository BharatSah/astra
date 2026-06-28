import { useState } from 'react';
import { isFallbackMode } from './models/dbClient.js';
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
  Fingerprint
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
  const { triggerEmail, emailLogs } = useEmailDispatch(notify);
  const {
    authLoading,
    isLoggedIn,
    currentUser,
    updateUser,
    syncUserFromSession,
    login,
    logout,
    passkeyReady,
    hasPasskey,
    passkeySetup,
    passkeyLogin
  } = useAuth(notify);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('services');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

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

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'expiry':
        return <ExpiryManagement onNotify={notify} onTriggerEmail={triggerEmail} onTabChange={setActiveTab} />;
      case 'password':
        return <PasswordManagement onNotify={notify} onTabChange={setActiveTab} />;
      case 'payment':
        return <PaymentReminders onNotify={notify} onTriggerEmail={triggerEmail} onTabChange={setActiveTab} />;
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
    return (
      <Login
        onNotify={notify}
        authLoading={authLoading}
        onLogin={handleLogin}
        passkeyReady={passkeyReady}
        hasPasskey={hasPasskey}
        passkeySetup={passkeySetup}
        passkeyLogin={passkeyLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-950/80 backdrop-blur-xl p-6 flex flex-col justify-between transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:sticky lg:top-0 lg:h-screen border-r border-white/5`}
      >
        <div className="space-y-8">
          {/* Logo / Branding */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <AstraLogo className="h-9 w-9" />
              <div>
                <span className="text-lg font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500">
                  Astra
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 lg:hidden"
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
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
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
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
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

        {/* Sidebar user profile footer */}
        <div className="pt-4 border-t border-white/5 mt-auto space-y-3">
          <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(3,7,18,0.92))] p-3 shadow-2xl shadow-black/25">
            <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="absolute -right-10 -top-12 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {isImageUrl(currentUser.avatar) ? (
                  <img
                    src={currentUser.avatar}
                    alt={`${currentUser.username}'s avatar`}
                    className="h-11 w-11 rounded-2xl object-cover shadow-md shadow-amber-500/20 border border-white/10"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center font-black text-white shadow-md shadow-amber-500/20">
                    {currentUser.avatar || 'B'}
                  </div>
                )}
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              </div>

              <div className="min-w-0 flex-1 pr-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="block truncate text-sm font-black text-slate-100">{currentUser.username}</span>
                </div>
                <span className="block truncate text-[10px] font-medium text-slate-400" title={currentUser.email}>{currentUser.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-500 transition duration-200 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 shrink-0 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-2.5">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 leading-none">
                    <span className="block whitespace-nowrap text-xs font-bold text-slate-200">Emails</span>
                    <span className="mt-1.5 block text-[10px] font-semibold text-slate-500">{emailStatus} today</span>
                  </div>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-right shadow-inner shadow-white/5 shrink-0">
                  <span className="block text-sm font-black text-rose-200 tabular-nums leading-none">
                    {emailsSentToday}/{dailyEmailTarget}
                  </span>
                </div>
              </div>

              <div
                className="mt-3 h-2 overflow-hidden rounded-full border border-white/5 bg-dark-950/80"
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
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>Daily SMTP limit</span>
                <span className="tabular-nums">{Math.round(emailProgress)}%</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-slate-600 text-center tracking-wide">Version 1.0.0 (c) Astra</p>
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
            className={`p-4 rounded-xl border shadow-xl flex justify-between items-start animate-slide-up backdrop-blur-xl ${
              notif.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300'
                : notif.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/20 text-rose-300'
                  : 'bg-amber-950/80 border-amber-500/20 text-amber-300'
            }`}
          >
            <p className="text-xs font-semibold">{notif.message}</p>
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

function Login({ onNotify, authLoading, onLogin, passkeyReady, hasPasskey, passkeySetup, passkeyLogin }) {
  const [loading, setLoading] = useState(false);

  const handlePasskeySetup = async () => {
    setLoading(true);
    try {
      await passkeySetup();
      onNotify('success', 'Passkey registered. Use it to sign in from now on.');
    } catch (error) {
      onNotify('error', error?.message || 'Passkey setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      await passkeyLogin();
      onNotify('success', 'Welcome back!');
    } catch (error) {
      onNotify('error', error?.message || 'Passkey authentication failed');
    } finally {
      setLoading(false);
    }
  };

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

        {!passkeyReady && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
            Passkeys are not supported in this browser. Use a secure context (HTTPS or localhost) and a modern browser.
          </div>
        )}

        {passkeyReady && !hasPasskey && (
          <>
            <p className="text-sm text-slate-400 text-center">
              {isFallbackMode
                ? 'Sign in with your device passkey instead of a password.'
                : 'Add a device passkey so you can unlock the vault and sign in faster next time.'}
            </p>
            <button
              onClick={handlePasskeySetup}
              disabled={loading || authLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 shimmer-btn cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {loading || authLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  {isFallbackMode ? 'Register Passkey' : 'Set Up Passkey'}
                </>
              )}
            </button>
          </>
        )}

        {passkeyReady && hasPasskey && (
          <>
            <p className="text-sm text-slate-400 text-center">
              Verify with your device passkey to unlock the app.
            </p>
            <button
              onClick={handlePasskeyLogin}
              disabled={loading || authLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 shimmer-btn cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {loading || authLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Sign in with Passkey
                </>
              )}
            </button>
          </>
        )}

        <div className="relative py-2 my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-dark-950 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isFallbackMode ? 'or continue with password' : 'or sign in with Supabase'}
            </span>
          </div>
        </div>

        <PasswordLoginForm onLogin={onLogin} onNotify={onNotify} authLoading={authLoading} />
      </div>
    </div>
  );
}

function PasswordLoginForm({ onLogin, onNotify, authLoading }) {
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
