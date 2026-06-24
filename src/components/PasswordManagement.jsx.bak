import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Plus, Eye, EyeOff, Copy, ExternalLink, Trash2, Edit2, Key, RefreshCw, X, Laptop } from 'lucide-react';

export default function PasswordManagement({ onNotify }) {
  const [passwords, setPasswords] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [platformName, setPlatformName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Password visibility tracking per entry
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch platforms and passwords in parallel
      const platformsRes = await supabase.from('platforms').select('*').order('platform_name', { ascending: true });
      const passwordsRes = await supabase.from('passwords').select('*').order('created_at', { ascending: false });

      if (platformsRes.error) throw platformsRes.error;
      if (passwordsRes.error) throw passwordsRes.error;

      setPlatforms(platformsRes.data || []);
      setPasswords(passwordsRes.data || []);
    } catch (err) {
      console.error('Error fetching vault data:', err.message);
      onNotify('error', 'Failed to retrieve passwords or platforms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setPlatformName(platforms[0]?.platform_name || '');
    setUsername('');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pw) => {
    setEditingId(pw.id);
    setPlatformName(pw.platform_name);
    setUsername(pw.username);
    setPassword(pw.password);
    setIsModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let length = 16;
    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    onNotify('success', 'Generated secure password!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!platformName || !username || !password) {
      onNotify('warning', 'Please fill in all required fields');
      return;
    }

    const payload = {
      platform_name: platformName,
      username,
      password
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('passwords').update(payload).eq('id', editingId);
        if (error) throw error;
        onNotify('success', 'Password updated successfully');
      } else {
        const { error } = await supabase.from('passwords').insert(payload);
        if (error) throw error;
        onNotify('success', 'Password saved successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error saving credentials');
    }
  };

  const handleDelete = async (id, platform) => {
    if (!confirm(`Are you sure you want to delete the credentials for ${platform}?`)) return;
    try {
      const { error } = await supabase.from('passwords').delete().eq('id', id);
      if (error) throw error;
      onNotify('success', 'Credentials deleted successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Error deleting credentials');
    }
  };

  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    onNotify('success', `${label} copied to clipboard!`);
  };

  // Filter passwords based on search term (also searches mapped platform url)
  const filteredPasswords = passwords.filter(pw => {
    const platform = platforms.find(p => p.platform_name === pw.platform_name);
    const urlMatches = platform?.url?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return pw.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           pw.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           urlMatches;
  });

  return (
    <div className="animate-slide-up flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
          Password Vault <span className="text-slate-400 text-base font-semibold ml-1">({filteredPasswords.length} total)</span>
        </h1>
      </div>

      {/* Compact Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search platform, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-slate-200 glass-input text-xs"
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition duration-200 shrink-0 sm:w-auto w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      {/* Main List Grid Container */}
      <div className="flex-1 flex flex-col">
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
        </div>
      ) : filteredPasswords.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850 flex-1 flex flex-col items-center justify-center">
          <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No credentials found matching your criteria.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Create your first password entry &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasswords.map((pw) => {
            // Find platform details dynamically via state join
            const plat = platforms.find(p => p.platform_name === pw.platform_name);

            return (
              <div
                key={pw.id}
                className="glass-panel p-5 rounded-2xl border border-slate-850 glass-panel-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      {plat?.logo ? (
                        <img 
                          src={plat.logo} 
                          alt={`${pw.platform_name} logo`} 
                          onError={(e) => { e.target.src = ''; }} // Prevent broken image tags
                          className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 border border-white/10 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 shrink-0">
                          {pw.platform_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <h3 className="font-bold text-base text-slate-100 truncate">
                          {pw.platform_name}
                        </h3>
                        {plat?.url && (
                          <a
                            href={plat.url.startsWith('http') ? plat.url : `https://${plat.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            <span className="truncate">{plat.url.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-brand-500" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl p-1 border border-slate-800 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(pw)}
                        className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg hover:bg-slate-850 transition"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pw.id, pw.platform_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-850 transition"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 bg-dark-950/80 p-3 rounded-xl border border-slate-900">
                    {/* Username */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Username</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-mono select-all">{pw.username}</span>
                        <button
                          onClick={() => handleCopyToClipboard(pw.username, 'Username')}
                          className="text-slate-400 hover:text-brand-400 transition"
                          title="Copy Username"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Password</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-mono select-all">
                          {visiblePasswords[pw.id] ? pw.password : '••••••••••••'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleVisibility(pw.id)}
                            className="text-slate-400 hover:text-brand-400 transition"
                            title={visiblePasswords[pw.id] ? "Hide Password" : "Show Password"}
                          >
                            {visiblePasswords[pw.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopyToClipboard(pw.password, 'Password')}
                            className="text-slate-400 hover:text-brand-400 transition"
                            title="Copy Password"
                          >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-full">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-slate-100">{editingId ? 'Edit Credential' : 'Store Credential'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto">
              {platforms.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400 space-y-3">
                  <p>You must add a platform in Settings first before saving passwords.</p>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      onNotify('warning', 'Please navigate to Settings > Platform Registry to configure platforms');
                    }}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Go to Settings
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Platform <span className="text-rose-500">*</span></label>
                      <select
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                        required
                      >
                        <option value="">Select Platform</option>
                        {platforms.map(p => (
                          <option key={p.platform_name} value={p.platform_name}>{p.platform_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">User Name / Email <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Password <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-600 text-slate-100 hover:bg-slate-500 rounded-lg transition duration-150 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition duration-200"
                    >
                      {editingId ? 'Update Credential' : 'Save Credential'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
