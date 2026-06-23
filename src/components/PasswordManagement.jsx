import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Plus, Eye, EyeOff, Copy, ExternalLink, Trash2, Edit2, Key, RefreshCw, X } from 'lucide-react';

export default function PasswordManagement({ onNotify }) {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Password visibility tracking per entry
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const fetchPasswords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('passwords').select('*').order('platform_name', { ascending: true });
      if (error) throw error;
      setPasswords(data || []);
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to retrieve passwords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setPlatformName('');
    setPlatformUrl('');
    setUsername('');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pw) => {
    setEditingId(pw.id);
    setPlatformName(pw.platform_name);
    setPlatformUrl(pw.platform_url || '');
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
      platform_url: platformUrl,
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
      fetchPasswords();
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
      fetchPasswords();
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

  // Filter passwords based on search term
  const filteredPasswords = passwords.filter(pw => 
    pw.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pw.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pw.platform_url && pw.platform_url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Dynamic Header Section matching user specification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Password <span className="gradient-text-purple">Vault</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Securely store, organize, and generate high-entropy credentials.</p>
        </div>

        {/* Search input in the center/header */}
        <div className="flex-1 max-w-md mx-0 md:mx-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search platform, username, or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
          />
        </div>

        {/* Add Password button in the top right */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium text-sm transition duration-200 shadow-lg shadow-brand-500/10 shimmer-btn shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
        </div>
      ) : filteredPasswords.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-850">
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
          {filteredPasswords.map((pw) => (
            <div
              key={pw.id}
              className="glass-panel p-5 rounded-2xl border border-slate-850 glass-panel-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                      {pw.platform_name}
                    </h3>
                    {pw.platform_url && (
                      <a
                        href={pw.platform_url.startsWith('http') ? pw.platform_url : `https://${pw.platform_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        {pw.platform_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl p-1 border border-slate-800">
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
          ))}
        </div>
      )}

      {/* Add/Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden animate-slide-up">
            {/* Header decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 to-indigo-600"></div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-brand-400" />
                  {editingId ? 'Edit Credentials' : 'Add New Password'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:bg-slate-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Platform Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, AWS, GitHub"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Platform URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://github.com"
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">User Name / Email *</label>
                  <input
                    type="text"
                    placeholder="e.g. admin@company.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password *</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate Secure
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Secure alphanumeric password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-slate-200 glass-input text-sm font-mono"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-900 text-slate-300 hover:text-white rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-medium shadow-lg shadow-brand-500/10 transition duration-200 shimmer-btn"
                  >
                    {editingId ? 'Save Changes' : 'Store Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
