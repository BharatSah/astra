import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary, isImageUrl } from '../cloudinary';
import { Plus, Trash2, Server, Laptop, Globe, Image, X, User, LogOut } from 'lucide-react';

export default function Settings({ onNotify, activeSubTab = 'services', currentUser, setCurrentUser, onLogout }) {
  
  // Services state
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Platforms state
  const [platforms, setPlatforms] = useState([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');
  const [newPlatformLogo, setNewPlatformLogo] = useState('');
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      onNotify('error', 'Only image files (PNG, JPG, SVG, etc.) are supported.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onNotify('error', 'File size exceeds 2MB limit.');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const url = await uploadToCloudinary(file);
      setNewPlatformLogo(url);
      onNotify('success', 'Logo uploaded to Cloudinary successfully');
    } catch (err) {
      console.error('Cloudinary upload error:', err.message);
      onNotify('error', err.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const profileFileInputRef = useRef(null);

  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  const handleProfileImageDrop = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      onNotify('error', 'Only image files (PNG, JPG, etc.) are supported.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onNotify('error', 'File size exceeds 2MB limit.');
      return;
    }
    setIsUploadingProfile(true);
    try {
      const url = await uploadToCloudinary(file);
      setCurrentUser({ avatar: url });
      onNotify('success', 'Profile image uploaded to Cloudinary successfully');
    } catch (err) {
      console.error('Cloudinary upload error:', err.message);
      onNotify('error', err.message || 'Failed to upload profile image.');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchPlatforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchServices() {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true });
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err.message);
      onNotify('error', 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  }

  async function fetchPlatforms() {
    setLoadingPlatforms(true);
    try {
      const { data, error } = await supabase.from('platforms').select('*').order('platform_name', { ascending: true });
      if (error) throw error;
      setPlatforms(data || []);
    } catch (err) {
      console.error('Error fetching platforms:', err.message);
      onNotify('error', 'Failed to load platforms');
    } finally {
      setLoadingPlatforms(false);
    }
  }

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      const { error } = await supabase.from('services').insert({
        name: newServiceName.trim(),
        description: newServiceDesc.trim()
      });
      if (error) throw error;

      onNotify('success', 'Service added successfully');
      setNewServiceName('');
      setNewServiceDesc('');
      setIsServiceModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Error adding service:', err.message);
      onNotify('error', err.message.includes('unique') ? 'Service name already exists' : 'Failed to add service');
    }
  };

  const handleDeleteService = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the service "${name}"? Customers using this service will lose their association.`)) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;

      onNotify('success', 'Service deleted successfully');
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err.message);
      onNotify('error', 'Failed to delete service');
    }
  };

  const handleAddPlatform = async (e) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;

    try {
      const { error } = await supabase.from('platforms').insert({
        platform_name: newPlatformName.trim(),
        url: newPlatformUrl.trim(),
        logo: newPlatformLogo.trim()
      });
      if (error) throw error;

      onNotify('success', 'Platform registry updated');
      setNewPlatformName('');
      setNewPlatformUrl('');
      setNewPlatformLogo('');
      setIsPlatformModalOpen(false);
      setShowUrlInput(false);
      setIsDragging(false);
      fetchPlatforms();
    } catch (err) {
      console.error('Error adding platform:', err.message);
      onNotify('error', err.message.includes('duplicate') || err.message.includes('primary') ? 'Platform name already registered' : 'Failed to add platform');
    }
  };

  const handleDeletePlatform = async (name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? WARNING: All passwords associated with this platform will also be deleted due to constraint dependencies.`)) return;

    try {
      const { error } = await supabase.from('platforms').delete().eq('platform_name', name);
      if (error) throw error;

      onNotify('success', 'Platform removed successfully');
      fetchPlatforms();
    } catch (err) {
      console.error('Error deleting platform:', err.message);
      onNotify('error', 'Failed to delete platform');
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          System <span className="gradient-text-purple">Settings</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm font-semibold">Configure services, password platforms, and SMTP email parameters.</p>
      </div>



      {/* Services Subpage */}
      {activeSubTab === 'services' && (
        <div className="flex-1 flex flex-col h-full space-y-4">
          {/* Service Directory list */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex-1 flex flex-col" style={{ minHeight: 'calc(100vh - 12rem)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Server className="w-5 h-5 text-brand-400" />
                Service Directory
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-brand-500/15 transition duration-200 shimmer-btn shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              </div>
            </div>

            {loadingServices ? (
              <div className="flex justify-center items-center py-24 flex-1">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 flex-1">
                <Server className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-sm">No services found. Add your first service to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 flex-1 overflow-y-auto pr-2">
                {services.map((service) => (
                  <div key={service.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 group">
                    <div className="pr-4">
                      <h3 className="font-bold text-slate-200 text-sm">{service.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{service.description || 'No description provided.'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteService(service.id, service.name)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition opacity-0 group-hover:opacity-100"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-dark-950/95 backdrop-blur-md animate-slide-up">
              <div className="flex justify-end px-6 pt-4 shrink-0">
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4 flex items-center justify-center">
                <div className="w-full max-w-lg">
                  <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                      <Server className="w-6 h-6 text-brand-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Add New Service</h2>
                    <p className="text-sm text-slate-400">Define a new service category for tracking.</p>
                  </div>

                  <form onSubmit={handleAddService} className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Service Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Premium Cloud Hosting"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                      <textarea
                        placeholder="Service particulars, pricing, or details..."
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm resize-none"
                      />
                    </div>
                    <div className="pt-4 flex justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setIsServiceModalOpen(false)}
                        className="px-5 py-3 bg-slate-900 text-slate-400 hover:text-white rounded-xl transition font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold shadow-lg shadow-brand-500/10 transition duration-200 shimmer-btn"
                      >
                        Create Service
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Platforms Subpage */}
      {activeSubTab === 'platforms' && (
        <div className="flex-1 flex flex-col h-full space-y-4">
          {/* Platforms Directory list */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex-1 flex flex-col" style={{ minHeight: 'calc(100vh - 12rem)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Laptop className="w-5 h-5 text-brand-400" />
                Registered Platforms
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlatformModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-brand-500/15 transition duration-200 shimmer-btn shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Platform
                </button>
              </div>
            </div>

            {loadingPlatforms ? (
              <div className="flex justify-center items-center py-24 flex-1">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
              </div>
            ) : platforms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 flex-1">
                <Laptop className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-sm">No platforms registered. Add your first platform to link credentials.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-2 pb-4 content-start">
                {platforms.map((platform) => (
                  <div key={platform.platform_name} className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3 truncate">
                      {platform.logo ? (
                        <img 
                          src={platform.logo} 
                          alt={`${platform.platform_name} logo`} 
                          onError={(e) => { e.target.src = ''; }} // prevent broken images showing
                          className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 shrink-0 border border-white/10" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-sm text-brand-400">
                          {platform.platform_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <h4 className="font-bold text-slate-200 text-sm truncate">{platform.platform_name}</h4>
                        {platform.url && (
                          <a 
                            href={platform.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[11px] text-brand-400 hover:underline block truncate mt-0.5"
                          >
                            {platform.url}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePlatform(platform.platform_name)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition opacity-0 group-hover:opacity-100 shrink-0"
                      title="Remove Platform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Platform Modal */}
          {isPlatformModalOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-dark-950/95 backdrop-blur-md animate-slide-up">
              <div className="flex justify-end px-6 pt-4 shrink-0">
                <button
                  onClick={() => setIsPlatformModalOpen(false)}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4 flex items-center justify-center">
                <div className="w-full max-w-lg">
                  <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                      <Laptop className="w-6 h-6 text-brand-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Register Platform</h2>
                    <p className="text-sm text-slate-400">Add a new platform to map your credentials.</p>
                  </div>

                  <form onSubmit={handleAddPlatform} className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Platform Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. GitHub, AWS, Google Workspace"
                        value={newPlatformName}
                        onChange={(e) => setNewPlatformName(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Platform URL</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                          <Globe className="w-4 h-4" />
                        </span>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={newPlatformUrl}
                          onChange={(e) => setNewPlatformUrl(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Platform Logo</label>
                      
                      {newPlatformLogo ? (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-brand-500/50 bg-brand-500/5 rounded-xl relative group min-h-[120px]">
                          <img 
                            src={newPlatformLogo} 
                            alt="Logo Preview" 
                            className="w-16 h-16 rounded-xl object-contain bg-white/5 p-1.5 border border-white/10 mb-2"
                          />
                          <span className="text-xs text-slate-400 truncate max-w-xs px-2">
                            {newPlatformLogo.startsWith('data:') ? 'Uploaded custom logo' : (isImageUrl(newPlatformLogo) ? 'Cloudinary logo uploaded' : newPlatformLogo)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setNewPlatformLogo('')}
                            className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                            title="Remove Logo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition duration-200 min-h-[120px] ${
                            isDragging 
                              ? 'border-brand-500 bg-brand-500/10 text-brand-400' 
                              : 'border-slate-700/80 hover:border-brand-500/60 bg-slate-800/20 hover:bg-slate-800/40 text-slate-400'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={(e) => handleFiles(e.target.files)}
                            accept="image/*" 
                            className="hidden" 
                          />
                          <Image className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? 'scale-110 text-brand-400' : 'text-slate-500'}`} />
                          <p className="text-xs font-semibold text-center">
                            {isUploadingLogo ? 'Uploading to Cloudinary...' : (isDragging ? 'Drop logo here!' : 'Drag & drop logo, or click to browse')}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, SVG (Max 2MB)</p>
                        </div>
                      )}
                      
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-[11px] text-brand-400 hover:underline animate-fade-in"
                        >
                          {showUrlInput ? 'Hide URL input' : 'Or paste a logo URL instead'}
                        </button>
                      </div>

                      {showUrlInput && (
                        <div className="mt-3 animate-fade-in">
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                              <Globe className="w-4 h-4" />
                            </span>
                            <input
                              type="url"
                              placeholder="https://cdn.svgporn.com/logos/example.svg"
                              value={newPlatformLogo}
                              onChange={(e) => setNewPlatformLogo(e.target.value)}
                              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 flex justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setIsPlatformModalOpen(false)}
                        className="px-5 py-3 bg-slate-900 text-slate-400 hover:text-white rounded-xl transition font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold shadow-lg shadow-brand-500/10 transition duration-200 shimmer-btn"
                      >
                        Register Platform
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Profile Subpage */}
      {activeSubTab === 'profile' && (
        <div className="flex-1 flex flex-col h-full space-y-4 animate-slide-up">
          <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex-1 flex flex-col" style={{ minHeight: 'calc(100vh - 12rem)' }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-brand-400" />
                User Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">Manage your administrative profile details and security settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Avatar & Basic Stats */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 flex flex-col items-center text-center justify-center space-y-4">
                {isImageUrl(currentUser?.avatar) ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={`${currentUser.username}'s avatar`} 
                    className="h-24 w-24 rounded-full object-cover shadow-xl shadow-brand-500/20 border border-white/10" 
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-black text-white text-4xl shadow-xl shadow-brand-500/20">
                    {currentUser?.avatar || 'B'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{currentUser?.username}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{currentUser?.role || 'Administrator'}</p>
                </div>
                <div className="pt-2 w-full">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out Account
                  </button>
                </div>
              </div>

              {/* Right Column: Editing Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/20 p-6 rounded-2xl border border-slate-850/80 space-y-5">
                  <h3 className="font-bold text-slate-200 text-sm">Account Particulars</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Username / Handle</label>
                      <input
                        type="text"
                        defaultValue={currentUser?.username}
                        onBlur={(e) => setCurrentUser({ username: e.target.value })}
                        placeholder="e.g. bharat.shah"
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm focus:scale-[1.01]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        defaultValue={currentUser?.email}
                        onBlur={(e) => setCurrentUser({ email: e.target.value, avatar: e.target.value.split('@')[0].charAt(0).toUpperCase() })}
                        placeholder="e.g. bharat@mithilacoders.com"
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm focus:scale-[1.01]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Designation / Role</label>
                      <input
                        type="text"
                        defaultValue={currentUser?.role || 'Administrator'}
                        onBlur={(e) => setCurrentUser({ role: e.target.value })}
                        placeholder="e.g. Cloud Lead"
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm focus:scale-[1.01]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Avatar Initial</label>
                      <input
                        type="text"
                        maxLength="1"
                        defaultValue={!isImageUrl(currentUser?.avatar) ? (currentUser?.avatar || 'B') : 'B'}
                        onBlur={(e) => setCurrentUser({ avatar: e.target.value.toUpperCase() })}
                        placeholder="B"
                        className="w-full px-4 py-3 rounded-xl text-slate-200 glass-input text-sm font-bold text-center focus:scale-[1.01]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Profile Image (Drag & Drop)</label>
                    {isImageUrl(currentUser?.avatar) ? (
                      <div className="flex flex-col items-center justify-center p-4 border border-dashed border-brand-500/50 bg-brand-500/5 rounded-xl relative min-h-[120px]">
                        <img 
                          src={currentUser.avatar} 
                          alt="Profile Preview" 
                          className="w-16 h-16 rounded-full object-cover shadow-md shadow-brand-500/20 mb-2 border border-white/10"
                        />
                        <span className="text-xs text-slate-400">Custom profile image active</span>
                        <button
                          type="button"
                          onClick={() => setCurrentUser({ avatar: (currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'B') })}
                          className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingProfile(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingProfile(false); }}
                        onDrop={(e) => { e.preventDefault(); setIsDraggingProfile(false); handleProfileImageDrop(e.dataTransfer.files); }}
                        onClick={() => profileFileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition duration-200 min-h-[120px] ${
                          isDraggingProfile 
                            ? 'border-brand-500 bg-brand-500/10 text-brand-400' 
                            : 'border-slate-700/80 hover:border-brand-500/60 bg-slate-800/20 hover:bg-slate-800/40 text-slate-400'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={profileFileInputRef}
                          onChange={(e) => handleProfileImageDrop(e.target.files)}
                          accept="image/*" 
                          className="hidden" 
                        />
                        <Image className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDraggingProfile ? 'scale-110 text-brand-400' : 'text-slate-500'}`} />
                        <p className="text-xs font-semibold text-center">
                          {isUploadingProfile ? 'Uploading to Cloudinary...' : (isDraggingProfile ? 'Drop profile image here!' : 'Drag & drop image, or click to browse')}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG (Max 2MB)</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onNotify('success', 'Profile details updated and stored!')}
                      className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl text-white font-bold text-xs shadow-lg shadow-brand-500/10 transition duration-200"
                    >
                      Save Account Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
