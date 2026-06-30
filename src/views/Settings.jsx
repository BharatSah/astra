import { useRef, useState } from 'react';
import { useSettings } from '../controllers/useSettings.js';
import { supabase, isFallbackMode } from '../models/dbClient.js';
import { isImageUrl } from '../services/cloudinaryService.js';
import {
  Globe,
  Image,
  Laptop,
  Lock,
  LogOut,
  Plus,
  Save,
  Server,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';

export default function Settings({
  onNotify,
  activeSubTab = 'services',
  currentUser,
  setCurrentUser,
  syncUserFromSession,
  onLogout,
  hasPassword = false,
  onSetPassword,
  onChangePassword
}) {
  const {
    services,
    platforms,
    loadingServices,
    loadingPlatforms,
    isUploadingLogo,
    isUploadingProfile,
    addService,
    removeService,
    addPlatform,
    removePlatform,
    uploadLogo,
    uploadProfileImage
  } = useSettings({ notify: onNotify, updateUser: setCurrentUser });

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');
  const [newPlatformLogo, setNewPlatformLogo] = useState('');
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const profileInputRef = useRef(null);

  const handleAddService = async (event) => {
    event.preventDefault();
    const ok = await addService(newServiceName, newServiceDesc);
    if (!ok) return;
    setNewServiceName('');
    setNewServiceDesc('');
    setIsServiceModalOpen(false);
  };

  const handleAddPlatform = async (event) => {
    event.preventDefault();
    const ok = await addPlatform({
      name: newPlatformName,
      url: newPlatformUrl,
      logo: newPlatformLogo
    });
    if (!ok) return;
    setNewPlatformName('');
    setNewPlatformUrl('');
    setNewPlatformLogo('');
    setShowLogoUrlInput(false);
    setIsDraggingLogo(false);
    setIsPlatformModalOpen(false);
  };

  const handleLogoFiles = async (files) => {
    if (!files || files.length === 0) return;
    const url = await uploadLogo(files[0]);
    if (url) setNewPlatformLogo(url);
  };

  const handleProfileFiles = async (files) => {
    if (!files || files.length === 0) return;
    await uploadProfileImage(files[0]);
  };

  const saveProfile = async ({ username, email }) => {
    const nextUser = {
      username: username.trim() || currentUser?.username || 'bharat.shah',
      email: email.trim() || currentUser?.email || 'bharat.shah@mithilacoders.com',
      role: currentUser?.role || 'Administrator',
      avatar: currentUser?.avatar || 'B'
    };

    if (!isFallbackMode) {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: nextUser.username,
          name: nextUser.username
        },
        email: nextUser.email
      });
      if (error) {
        onNotify('error', error.message || 'Failed to update profile.');
        return;
      }
      await syncUserFromSession?.();
    }

    setCurrentUser(nextUser);
    onNotify('success', 'Profile updated successfully.');
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            System Settings
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          System <span className="gradient-text-gold">Settings</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm font-semibold">
          Configure services, password platforms, and your profile.
        </p>
      </div>

      {activeSubTab === 'services' && (
        <ServicesSection
          services={services}
          loading={loadingServices}
          onOpenAdd={() => setIsServiceModalOpen(true)}
          onDelete={removeService}
        />
      )}

      {activeSubTab === 'platforms' && (
        <PlatformsSection
          platforms={platforms}
          loading={loadingPlatforms}
          onOpenAdd={() => setIsPlatformModalOpen(true)}
          onDelete={removePlatform}
        />
      )}

      {activeSubTab === 'profile' && (
        <ProfileSection
          currentUser={currentUser}
          onLogout={onLogout}
          profileInputRef={profileInputRef}
          onProfileFiles={handleProfileFiles}
          isUploadingProfile={isUploadingProfile}
          onSave={saveProfile}
          hasPassword={hasPassword}
          onSetPassword={onSetPassword}
          onChangePassword={onChangePassword}
          onNotify={onNotify}
        />
      )}

      {isServiceModalOpen && (
        <ServiceModal
          name={newServiceName}
          description={newServiceDesc}
          onNameChange={setNewServiceName}
          onDescriptionChange={setNewServiceDesc}
          onSubmit={handleAddService}
          onClose={() => setIsServiceModalOpen(false)}
        />
      )}

      {isPlatformModalOpen && (
        <PlatformModal
          name={newPlatformName}
          url={newPlatformUrl}
          logo={newPlatformLogo}
          showLogoUrlInput={showLogoUrlInput}
          isUploadingLogo={isUploadingLogo}
          isDraggingLogo={isDraggingLogo}
          logoInputRef={logoInputRef}
          onNameChange={setNewPlatformName}
          onUrlChange={setNewPlatformUrl}
          onLogoChange={setNewPlatformLogo}
          onToggleLogoUrl={() => setShowLogoUrlInput(prev => !prev)}
          onDragChange={setIsDraggingLogo}
          onLogoFiles={handleLogoFiles}
          onSubmit={handleAddPlatform}
          onClose={() => setIsPlatformModalOpen(false)}
        />
      )}
    </div>
  );
}

function ServicesSection({ services, loading, onOpenAdd, onDelete }) {
  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[calc(100vh-12rem)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            Service Directory
          </h2>
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition duration-200 shimmer-btn shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>

        {loading ? (
          <LoadingState />
        ) : services.length === 0 ? (
          <EmptyState icon={Server} text="No services found. Add your first service to get started." />
        ) : (
          <div className="divide-y divide-white/5 flex-1 overflow-y-auto pr-2">
            {services.map(service => (
              <div key={service.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 group">
                <div className="pr-4">
                  <h3 className="font-bold text-slate-200 text-sm">{service.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{service.description || 'No description provided.'}</p>
                </div>
                <button
                  onClick={() => onDelete(service.id, service.name)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition opacity-0 group-hover:opacity-100"
                  title="Delete Service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformsSection({ platforms, loading, onOpenAdd, onDelete }) {
  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[calc(100vh-12rem)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Laptop className="w-5 h-5 text-emerald-400" />
            Registered Platforms
          </h2>
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition duration-200 shimmer-btn shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Platform
          </button>
        </div>

        {loading ? (
          <LoadingState />
        ) : platforms.length === 0 ? (
          <EmptyState icon={Laptop} text="No platforms registered. Add your first platform to link credentials." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-2 pb-4 content-start">
            {platforms.map(platform => {
              const url = platform.url ? (platform.url.startsWith('http') ? platform.url : `https://${platform.url}`) : null;
              const host = platform.url ? platform.url.replace(/^https?:\/\//, '').replace(/\/.*/, '') : null;
              return (
              <div key={platform.platform_name} className="group relative flex flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] overflow-hidden transition-all duration-300 hover:border-emerald-500/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10">
                {/* Top accent line */}
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-400/70 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Logo header */}
                <div className="relative flex items-center justify-center pt-6 pb-4">
                  <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
                  {platform.logo ? (
                    <img
                      src={platform.logo}
                      alt={`${platform.platform_name} logo`}
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      className="relative h-14 w-14 rounded-2xl object-contain bg-white/[0.04] p-2 border border-white/10 shadow-lg shadow-black/20 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-lg text-emerald-400 shadow-lg shadow-emerald-500/10 transition-transform duration-300 group-hover:scale-105">
                      {platform.platform_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 pb-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-100 text-sm text-center leading-tight line-clamp-2" title={platform.platform_name}>{platform.platform_name}</h4>
                  {host ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-emerald-400/80 hover:text-emerald-300 transition truncate"
                      title={url}
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate">{host}</span>
                    </a>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-600 text-center">No URL provided</p>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/5 bg-dark-950/30">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition px-2 py-1 rounded-lg hover:bg-white/5"
                      title="Open platform"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  ) : <span />}
                  <button
                    onClick={() => onDelete(platform.platform_name)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-400 transition px-2 py-1 rounded-lg hover:bg-rose-500/10"
                    title="Remove platform"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSection({
  currentUser,
  onLogout,
  profileInputRef,
  onProfileFiles,
  isUploadingProfile,
  onSave,
  hasPassword,
  onSetPassword,
  onChangePassword,
  onNotify
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftUsername, setDraftUsername] = useState(currentUser?.username || '');
  const [draftEmail, setDraftEmail] = useState(currentUser?.email || '');

  const username = currentUser?.username || 'bharat.shah';
  const email = currentUser?.email || 'bharat.shah@mithilacoders.com';
  const avatar = currentUser?.avatar || 'B';
  const isImageAvatar = isImageUrl(avatar);

  const handleSave = async () => {
    await onSave({ username: draftUsername, email: draftEmail });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftUsername(username);
    setDraftEmail(email);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full space-y-4 animate-slide-up">
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[calc(100vh-12rem)] relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: profile card */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6 flex flex-col items-center text-center">
            <button
              type="button"
              title="Change profile picture"
              onClick={() => setShowUpload(true)}
              className="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4"
            >
              <img
                src={avatar}
                alt={`${username}'s avatar`}
                className={`h-28 w-28 rounded-full object-cover border-2 border-white/10 shadow-2xl shadow-amber-500/10 transition-transform group-hover:scale-[1.02] ${isImageAvatar ? '' : 'hidden'}`}
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
              {!isImageAvatar && (
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white text-4xl shadow-2xl shadow-amber-500/10 transition-transform group-hover:scale-[1.02]">
                  {avatar}
                </div>
              )}
              <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                <Image className="h-3.5 w-3.5" />
              </span>
            </button>

            {!isEditing ? (
              <>
                <div>
                  <h3 className="text-xl font-black text-slate-100">{username}</h3>
                  <p className="text-xs text-slate-400 mt-1">{email}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition duration-200 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent text-xs font-bold transition duration-200 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full max-w-xs space-y-3 mt-2">
                <div className="text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={draftUsername}
                    onChange={(event) => setDraftUsername(event.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div className="text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={draftEmail}
                    onChange={(event) => setDraftEmail(event.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-slate-200 glass-input text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-xs shadow-lg shadow-amber-500/10 transition duration-200 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition duration-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Account Security */}
          <PasswordSecurityPanel
            hasPassword={hasPassword}
            onSetPassword={onSetPassword}
            onChangePassword={onChangePassword}
            onNotify={onNotify}
          />
        </div>

        {showUpload && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-slide-up"
            onClick={() => setShowUpload(false)}
          >
            <div
              className="w-full max-w-sm glass-panel border border-white/10 rounded-2xl shadow-2xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100">Upload Profile Picture</h3>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  onProfileFiles(event.dataTransfer.files);
                }}
                onClick={() => profileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition duration-200 min-h-[180px] ${
                  isDragging
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700/80 hover:border-amber-500/60 bg-slate-800/20 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <input
                  type="file"
                  ref={profileInputRef}
                  onChange={(event) => onProfileFiles(event.target.files)}
                  accept="image/*"
                  className="hidden"
                />
                <Image className={`w-10 h-10 mb-3 transition-transform duration-200 ${isDragging ? 'scale-110 text-amber-400' : 'text-slate-500'}`} />
                <p className="text-xs font-semibold text-center">
                  {isUploadingProfile ? 'Uploading...' : (isDragging ? 'Drop here' : 'Drag & drop or click to upload')}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceModal({ name, description, onNameChange, onDescriptionChange, onSubmit, onClose }) {
  return (
    <FullScreenModal onClose={onClose}>
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Server className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Add New Service</h2>
          <p className="text-sm text-slate-400">Define a new service category for tracking.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Field label="Service Name *">
            <input
              type="text"
              placeholder="e.g. Premium Cloud Hosting"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              placeholder="Service particulars, pricing, or details..."
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows="3"
              className="w-full px-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm resize-none"
            />
          </Field>
          <ModalActions onClose={onClose} submitText="Create Service" tone="amber" />
        </form>
      </div>
    </FullScreenModal>
  );
}

function PlatformModal({
  name,
  url,
  logo,
  showLogoUrlInput,
  isUploadingLogo,
  isDraggingLogo,
  logoInputRef,
  onNameChange,
  onUrlChange,
  onLogoChange,
  onToggleLogoUrl,
  onDragChange,
  onLogoFiles,
  onSubmit,
  onClose
}) {
  return (
    <FullScreenModal onClose={onClose}>
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Laptop className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Register Platform</h2>
          <p className="text-sm text-slate-400">Add a new platform to map your credentials.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Field label="Platform Name *">
            <input
              type="text"
              placeholder="e.g. GitHub, AWS, Google Workspace"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
              required
            />
          </Field>
          <Field label="Platform URL">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => onUrlChange(event.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
              />
            </div>
          </Field>

          <Field label="Platform Logo">
            {logo ? (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-emerald-500/50 bg-emerald-500/5 rounded-xl relative group min-h-[120px]">
                <img
                  src={logo}
                  alt="Logo Preview"
                  className="w-16 h-16 rounded-xl object-contain bg-white/5 p-1.5 border border-white/10 mb-2"
                />
                <span className="text-xs text-slate-400 truncate max-w-xs px-2">
                  {logo.startsWith('data:') ? 'Uploaded custom logo' : (isImageUrl(logo) ? 'Logo ready' : logo)}
                </span>
                <button
                  type="button"
                  onClick={() => onLogoChange('')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                  title="Remove Logo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(event) => { event.preventDefault(); onDragChange(true); }}
                onDragLeave={(event) => { event.preventDefault(); onDragChange(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  onDragChange(false);
                  onLogoFiles(event.dataTransfer.files);
                }}
                onClick={() => logoInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition duration-200 min-h-[120px] ${
                  isDraggingLogo
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700/80 hover:border-emerald-500/60 bg-slate-800/20 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={(event) => onLogoFiles(event.target.files)}
                  accept="image/*"
                  className="hidden"
                />
                <Image className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDraggingLogo ? 'scale-110 text-emerald-400' : 'text-slate-500'}`} />
                <p className="text-xs font-semibold text-center">
                  {isUploadingLogo ? 'Uploading to Cloudinary...' : (isDraggingLogo ? 'Drop logo here!' : 'Drag and drop logo, or click to browse')}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, SVG (Max 2MB)</p>
              </div>
            )}

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={onToggleLogoUrl}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                {showLogoUrlInput ? 'Hide URL input' : 'Or paste a logo URL instead'}
              </button>
            </div>

            {showLogoUrlInput && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    placeholder="https://cdn.svgporn.com/logos/example.svg"
                    value={logo}
                    onChange={(event) => onLogoChange(event.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
                  />
                </div>
              </div>
            )}
          </Field>

          <ModalActions onClose={onClose} submitText="Register Platform" tone="emerald" />
        </form>
      </div>
    </FullScreenModal>
  );
}

function FullScreenModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark-950/95 backdrop-blur-md animate-slide-up">
      <div className="flex justify-end px-6 pt-4 shrink-0">
        <button
          onClick={onClose}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition border border-white/10"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-4 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, submitText, tone }) {
  const submitClass = tone === 'emerald'
    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/10'
    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/10';

  return (
    <div className="pt-4 flex justify-end gap-3 text-sm">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition font-semibold"
      >
        Cancel
      </button>
      <button
        type="submit"
        className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition duration-200 shimmer-btn ${submitClass}`}
      >
        {submitText}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordSecurityPanel({
  hasPassword,
  onSetPassword,
  onChangePassword,
  onNotify
}) {
  const [loginForm, setLoginForm] = useState({ current: '', next: '', confirm: '' });
  const updateLoginForm = (field, value) => setLoginForm(prev => ({ ...prev, [field]: value }));

  const handleLoginPasswordSubmit = async (event) => {
    event.preventDefault();
    if (loginForm.next !== loginForm.confirm) {
      onNotify('error', 'New password confirmation does not match.');
      return;
    }

    const result = hasPassword
      ? await onChangePassword?.(loginForm.current, loginForm.next)
      : await onSetPassword?.(loginForm.next);

    if (result?.ok) {
      setLoginForm({ current: '', next: '', confirm: '' });
      onNotify('success', hasPassword ? 'Login password updated.' : 'Login password secured.');
    } else {
      onNotify('error', result?.error || 'Unable to update login password.');
    }
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6 flex flex-col h-full">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Account Security</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isFallbackMode
              ? 'Local mode stores password hashes in this browser only.'
              : 'Cloud mode uses Supabase Auth for account password changes.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleLoginPasswordSubmit} className="space-y-4 p-4 rounded-xl bg-dark-950/50 border border-white/5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Lock className="w-4 h-4 text-amber-400" />
          {hasPassword ? 'Change Login Password' : 'Set Login Password'}
        </div>

        {hasPassword && (
          <PasswordInput
            label="Current Password"
            value={loginForm.current}
            onChange={(value) => updateLoginForm('current', value)}
            placeholder="Current login password"
          />
        )}
        <PasswordInput
          label="New Password"
          value={loginForm.next}
          onChange={(value) => updateLoginForm('next', value)}
          placeholder="At least 6 characters"
        />
        <PasswordInput
          label="Confirm New Password"
          value={loginForm.confirm}
          onChange={(value) => updateLoginForm('confirm', value)}
          placeholder="Repeat new password"
        />
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-sm transition duration-200 shimmer-btn cursor-pointer"
        >
          {hasPassword ? 'Change Login Password' : 'Set Login Password'}
        </button>
      </form>
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-11 rounded-xl text-slate-200 glass-input text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition"
          tabIndex={-1}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center py-24 flex-1">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500 flex-1">
      <Icon className="w-12 h-12 text-slate-700 mb-4" />
      <p className="text-sm text-center">{text}</p>
    </div>
  );
}
