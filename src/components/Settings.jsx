import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Server, Laptop, Globe, Image, X } from 'lucide-react';

export default function Settings({ onNotify, activeSubTab = 'services' }) {
  
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
                            rel="noreferrer" 
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
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Logo URL</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                          <Image className="w-4 h-4" />
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
    </div>
  );
}
