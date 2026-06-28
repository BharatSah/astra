import { useState } from 'react';
import { usePasswords } from '../controllers/usePasswords.js';
import { Search, Plus, Eye, EyeOff, Copy, ExternalLink, Trash2, Edit2, Key, RefreshCw, X, Laptop, Lock, Shield, Fingerprint } from 'lucide-react';
import {
  hasRegisteredPasskey,
  authenticatePasskey,
  unwrapVaultPassphrase,
  registerPasskey,
  generateVaultPassphrase,
  wrapVaultPassphrase,
  hasWrappedVaultKey,
} from '../services/passkeyService.js';

export default function PasswordManagement({ onNotify, onTabChange }) {
  const {
    passwords, platforms, loading,
    vaultUnlocked, decryptedPasswords, visiblePasswords,
    unlockVault, lockVault, decryptEntry, savePassword, removePassword, toggleVisibility
  } = usePasswords({ notify: onNotify });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [platformName, setPlatformName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [passkeyState, setPasskeyState] = useState({ registered: false, hasVault: false });

  const handleOpenAddModal = () => {
    if (!vaultUnlocked) { onNotify('warning', 'Unlock the vault first to add credentials.'); return; }
    setEditingId(null);
    setPlatformName(platforms[0]?.platform_name || '');
    setUsername(''); setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (pw) => {
    if (!vaultUnlocked) { onNotify('warning', 'Unlock the vault first to edit credentials.'); return; }
    setEditingId(pw.id);
    setPlatformName(pw.platform_name);
    setUsername(pw.username);
    const plain = await decryptEntry(pw);
    setPassword(plain);
    setIsModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const length = 20;
    const max = Math.floor(0xFFFFFFFF / chars.length) * chars.length;
    const buf = new Uint32Array(1);
    let generated = '';
    while (generated.length < length) {
      crypto.getRandomValues(buf);
      if (buf[0] < max) generated += chars.charAt(buf[0] % chars.length);
    }
    setPassword(generated);
    onNotify('success', 'Generated secure password!');
  };

  useState(() => {
    // Immediately invoked state updater to avoid useEffect import churn
    Promise.all([hasRegisteredPasskey(), hasWrappedVaultKey()]).then(([registered, hasVault]) => {
      setPasskeyState({ registered, hasVault });
    });
  });

  const handleUnlockVault = async () => {
    setUnlockError('');
    setUnlocking(true);
    try {
      const registered = await hasRegisteredPasskey();
      if (!registered) {
        await registerPasskey();
        const key = await authenticatePasskey();
        const passphrase = generateVaultPassphrase();
        await wrapVaultPassphrase(passphrase, key);
        unlockVault(passphrase);
        onNotify('success', 'Vault initialized and unlocked with passkey.');
        return;
      }
      const key = await authenticatePasskey();
      const passphrase = await unwrapVaultPassphrase(key);
      if (!passphrase) {
        setUnlockError('Vault is not set up for this passkey. Please reset or re-register.');
        return;
      }
      unlockVault(passphrase);
      onNotify('success', 'Vault unlocked with passkey.');
    } catch (err) {
      console.error('Vault unlock error:', err);
      setUnlockError(err?.message || 'Passkey verification failed.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await savePassword({ editingId, platformName, username, password });
    if (ok) setIsModalOpen(false);
  };

  const handleDelete = async (id, platform) => { await removePassword(id, platform); };

  const handleCopyToClipboard = async (text, label) => {
    try { await navigator.clipboard.writeText(text); onNotify('success', `${label} copied to clipboard!`); }
    catch { onNotify('error', 'Clipboard access denied'); }
  };
  const handleCopyPassword = async (pw) => {
    const plain = await decryptEntry(pw);
    await handleCopyToClipboard(plain, 'Password');
  };

  const filteredPasswords = passwords.filter(pw => {
    const platform = platforms.find(p => p.platform_name === pw.platform_name);
    const urlMatches = platform?.url?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return pw.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           pw.username.toLowerCase().includes(searchTerm.toLowerCase()) || urlMatches;
  });

  return (
    <div className="animate-slide-up flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Password Vault</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
            Password Vault <span className="text-slate-500 text-base font-semibold ml-1">({filteredPasswords.length} total)</span>
          </h1>
        </div>
        {vaultUnlocked && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              Vault Unlocked
            </span>
            <button onClick={lockVault} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer" title="Lock vault and clear decrypted secrets from memory">
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>
          </div>
        )}
      </div>

      {!vaultUnlocked ? (
        <div className="glass-panel p-10 rounded-3xl border border-white/5 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-full">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-5 mx-auto">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-1.5">Vault Locked</h2>
            <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
              Unlock with your device passkey. The vault key is released only after biometric or PIN verification and is never transmitted.
            </p>

            {!passkeyState.registered && (
              <p className="text-[11px] text-slate-500 mb-4">
                No passkey found. Setting one up now will create a new encrypted vault.
              </p>
            )}

            <button
              onClick={handleUnlockVault}
              disabled={unlocking}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-bold text-sm transition shadow-lg shadow-emerald-500/10 shimmer-btn cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {unlocking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  {passkeyState.hasVault ? 'Unlock with Passkey' : 'Create Passkey & Unlock'}
                </>
              )}
            </button>

            {unlockError && <p className="mt-4 text-xs text-rose-400">{unlockError}</p>}

            <p className="mt-4 text-[10px] text-slate-600 max-w-xs mx-auto">
              Credentials are encrypted at rest with AES-GCM. Without your passkey the vault cannot be opened.
            </p>
          </div>
        </div>
      ) : (
      <>
      {/* Compact Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search platform, username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl text-slate-200 glass-input text-xs" />
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition duration-200 shrink-0 sm:w-auto w-full justify-center shimmer-btn">
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      <div className="flex-1 flex flex-col">
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
        </div>
      ) : filteredPasswords.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 flex-1 flex flex-col items-center justify-center">
          <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No credentials found matching your criteria.</p>
          <button onClick={handleOpenAddModal} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition">
            Create your first password entry &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasswords.map((pw) => {
            const plat = platforms.find(p => p.platform_name === pw.platform_name);
            return (
              <div key={pw.id} className="glass-panel p-5 rounded-2xl border border-white/5 glass-panel-hover flex flex-col justify-between relative overflow-hidden">
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400/40" />
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      {plat?.logo ? (
                        <img src={plat.logo} alt={`${pw.platform_name} logo`} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                          {pw.platform_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <h3 className="font-bold text-base text-slate-100 truncate">{pw.platform_name}</h3>
                        {plat?.url && (
                          <a href={plat.url.startsWith('http') ? plat.url : `https://${plat.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 truncate">
                            <span className="truncate">{plat.url.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-emerald-500" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10 shrink-0">
                      <button onClick={() => handleOpenEditModal(pw)} className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition" title="Edit Entry">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(pw.id, pw.platform_name)} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition" title="Delete Entry">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 bg-dark-950/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Username</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-mono select-all">{pw.username}</span>
                        <button onClick={() => handleCopyToClipboard(pw.username, 'Username')} className="text-slate-400 hover:text-emerald-400 transition" title="Copy Username">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Password</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-mono select-all">
                          {visiblePasswords[pw.id] ? (decryptedPasswords[pw.id] ?? '************') : '************'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleVisibility(pw)} className="text-slate-400 hover:text-emerald-400 transition" title={visiblePasswords[pw.id] ? "Hide Password" : "Show Password"}>
                            {visiblePasswords[pw.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleCopyPassword(pw)} className="text-slate-400 hover:text-emerald-400 transition" title="Copy Password">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Add / Edit Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-slide-up">
          <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl shadow-2xl shadow-emerald-500/5 flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  {editingId ? <Edit2 className="w-5 h-5 text-white" /> : <Key className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Credential' : 'Store Credential'}</h2>
                  <p className="text-xs text-slate-400">{editingId ? 'Update saved login details.' : 'Securely save a new platform credential.'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {platforms.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-600">
                    <Laptop className="w-7 h-7" />
                  </div>
                  <p>You must add a platform in Settings first.</p>
                  <button onClick={() => { setIsModalOpen(false); onTabChange?.('settings'); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer">
                    Go to Settings
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Platform <span className="text-rose-500">*</span></label>
                    <select value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm bg-dark-900 cursor-pointer transition-all duration-200 focus:scale-[1.01]" required>
                      <option value="">Choose a platform</option>
                      {platforms.map(p => (<option key={p.platform_name} value={p.platform_name}>{p.platform_name}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Username / Email <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="e.g. john.doe@company.com" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm transition-all duration-200 focus:scale-[1.01]" required />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password <span className="text-rose-500">*</span></label>
                      <button type="button" onClick={handleGeneratePassword} className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                        <RefreshCw className="w-3 h-3" />
                        Generate strong password
                      </button>
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="Enter or generate a password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-4 pr-12 py-3 rounded-xl text-slate-200 glass-input text-sm font-mono tracking-wider transition-all duration-200 focus:scale-[1.01]" required />
                      {password && (
                        <button type="button" onClick={() => handleCopyToClipboard(password, 'Password')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all duration-200 cursor-pointer" title="Copy password">
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {[1, 2, 3, 4].map((bar) => {
                        const strength = password.length >= 16 ? 4 : password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length > 0 ? 1 : 0;
                        const color = strength >= bar ? (strength === 4 ? 'bg-emerald-500' : strength === 3 ? 'bg-amber-400' : 'bg-rose-500') : 'bg-white/5';
                        return (<span key={bar} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${color}`} />);
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {password.length >= 16 ? 'Great - this password looks strong.' : password.length > 0 ? 'Tip: use at least 16 characters for better security.' : 'A strong password will be generated automatically if you click above.'}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 text-sm">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all duration-200 font-semibold cursor-pointer">Cancel</button>
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-bold transition-all duration-200 shadow-lg shadow-emerald-500/10 shimmer-btn cursor-pointer">
                      {editingId ? 'Update Credential' : 'Save Credential'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
