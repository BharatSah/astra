import { useRef, useState, useEffect } from 'react';
import { useSettings } from '../controllers/useSettings.js';
import { supabase } from '../models/dbClient.js';
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
  ExternalLink,
  MoreVertical,
  Pencil
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
    isUploadingServiceLogo,
    isUploadingProfile,
    addService,
    editService,
    removeService,
    addPlatform,
    editPlatform,
    removePlatform,
    uploadLogo,
    uploadServiceLogo,
    uploadProfileImage
  } = useSettings({ notify: onNotify });

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceLogo, setNewServiceLogo] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [showServiceLogoUrlInput, setShowServiceLogoUrlInput] = useState(false);
  const [isDraggingServiceLogo, setIsDraggingServiceLogo] = useState(false);
  const serviceLogoInputRef = useRef(null);

  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformUrl, setNewPlatformUrl] = useState('');
  const [newPlatformLogo, setNewPlatformLogo] = useState('');
  const [editingPlatformName, setEditingPlatformName] = useState(null);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const persistProfileAvatar = async (url) => {
    const avatarValue = (url || '').trim();
    const fallback = (currentUser?.username || 'U').charAt(0).toUpperCase();
    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarValue || null,
        avatar: avatarValue || null,
      },
    });
    if (error) {
      onNotify('error', error.message || 'Failed to save profile image.');
      return false;
    }
    await syncUserFromSession?.();
    setCurrentUser(prev => ({ ...prev, avatar: avatarValue || fallback }));
    return true;
  };

  const resetServiceForm = () => {
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceLogo('');
    setShowServiceLogoUrlInput(false);
    setIsDraggingServiceLogo(false);
    setEditingServiceId(null);
  };

  const resetPlatformForm = () => {
    setNewPlatformName('');
    setNewPlatformUrl('');
    setNewPlatformLogo('');
    setShowLogoUrlInput(false);
    setIsDraggingLogo(false);
    setEditingPlatformName(null);
  };

  const openAddService = () => {
    resetServiceForm();
    setIsServiceModalOpen(true);
  };

  const openEditService = (service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServiceDesc(service.description || '');
    setNewServiceLogo(service.logo || '');
    setShowServiceLogoUrlInput(!!service.logo);
    setIsDraggingServiceLogo(false);
    setIsServiceModalOpen(true);
  };

  const openAddPlatform = () => {
    resetPlatformForm();
    setIsPlatformModalOpen(true);
  };

  const openEditPlatform = (platform) => {
    setEditingPlatformName(platform.platform_name);
    setNewPlatformName(platform.platform_name);
    setNewPlatformUrl(platform.url || '');
    setNewPlatformLogo(platform.logo || '');
    setShowLogoUrlInput(!!platform.logo);
    setIsDraggingLogo(false);
    setIsPlatformModalOpen(true);
  };

  const handleSaveService = async (event) => {
    event.preventDefault();
    const payload = {
      name: newServiceName,
      description: newServiceDesc,
      logo: newServiceLogo,
    };
    const ok = editingServiceId
      ? await editService(editingServiceId, payload)
      : await addService(payload);
    if (!ok) return;
    resetServiceForm();
    setIsServiceModalOpen(false);
  };

  const handleSavePlatform = async (event) => {
    event.preventDefault();
    const payload = {
      name: newPlatformName,
      url: newPlatformUrl,
      logo: newPlatformLogo,
    };
    const ok = editingPlatformName
      ? await editPlatform(editingPlatformName, payload)
      : await addPlatform(payload);
    if (!ok) return;
    resetPlatformForm();
    setIsPlatformModalOpen(false);
  };

  const handleLogoFiles = async (files) => {
    if (!files || files.length === 0) return;
    const url = await uploadLogo(files[0]);
    if (url) setNewPlatformLogo(url);
  };

  const handleServiceLogoFiles = async (files) => {
    if (!files || files.length === 0) return;
    const url = await uploadServiceLogo(files[0]);
    if (url) setNewServiceLogo(url);
  };

  const handleProfileFiles = async (files) => {
    if (!files || files.length === 0) return;
    const url = await uploadProfileImage(files[0]);
    if (url) await persistProfileAvatar(url);
  };

  const handleProfileImageChange = async (value) => {
    if (!value) {
      await persistProfileAvatar('');
      return;
    }
    if (isImageUrl(value)) {
      await persistProfileAvatar(value);
    }
  };

  const saveProfile = async ({ username, email }) => {
    const nextUser = {
      username: username.trim() || currentUser?.username || '',
      email: email.trim() || currentUser?.email || '',
      role: currentUser?.role || 'Administrator',
      avatar: currentUser?.avatar || '?',
    };

    const { error } = await supabase.auth.updateUser({
      data: {
        username: nextUser.username,
        name: nextUser.username,
        avatar_url: isImageUrl(nextUser.avatar) ? nextUser.avatar : null,
        avatar: isImageUrl(nextUser.avatar) ? nextUser.avatar : null,
      },
      email: nextUser.email,
    });
    if (error) {
      onNotify('error', error.message || 'Failed to update profile.');
      return;
    }
    await syncUserFromSession?.();

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
          onOpenAdd={openAddService}
          onEdit={openEditService}
          onDelete={removeService}
        />
      )}

      {activeSubTab === 'platforms' && (
        <PlatformsSection
          platforms={platforms}
          loading={loadingPlatforms}
          onOpenAdd={openAddPlatform}
          onEdit={openEditPlatform}
          onDelete={removePlatform}
        />
      )}

      {activeSubTab === 'profile' && (
        <ProfileSection
          currentUser={currentUser}
          onLogout={onLogout}
          profileImage={isImageUrl(currentUser?.avatar) ? currentUser.avatar : ''}
          onProfileImageChange={handleProfileImageChange}
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
          isEditing={!!editingServiceId}
          name={newServiceName}
          description={newServiceDesc}
          logo={newServiceLogo}
          showLogoUrlInput={showServiceLogoUrlInput}
          isUploadingLogo={isUploadingServiceLogo}
          isDraggingLogo={isDraggingServiceLogo}
          logoInputRef={serviceLogoInputRef}
          onNameChange={setNewServiceName}
          onDescriptionChange={setNewServiceDesc}
          onLogoChange={setNewServiceLogo}
          onToggleLogoUrl={() => setShowServiceLogoUrlInput(prev => !prev)}
          onDragChange={setIsDraggingServiceLogo}
          onLogoFiles={handleServiceLogoFiles}
          onSubmit={handleSaveService}
          onClose={() => { resetServiceForm(); setIsServiceModalOpen(false); }}
        />
      )}

      {isPlatformModalOpen && (
        <PlatformModal
          isEditing={!!editingPlatformName}
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
          onSubmit={handleSavePlatform}
          onClose={() => { resetPlatformForm(); setIsPlatformModalOpen(false); }}
        />
      )}
    </div>
  );
}

function ServicesSection({ services, loading, onOpenAdd, onEdit, onDelete }) {
  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[calc(100vh-12rem)]">
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
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
          <div className="grid grid-cols-4 gap-4 flex-1 overflow-y-auto pr-2 pb-4 content-start">
            {services.map(service => (
              <div key={service.id} className="group relative flex flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] transition-all duration-300 hover:border-amber-500/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10">
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400/70 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                <CardActionMenu
                  accent="amber"
                  onEdit={() => onEdit(service)}
                  onDelete={() => onDelete(service.id, service.name)}
                />

                <div className="flex justify-center py-3 px-2 pt-8">
                  <div className="relative aspect-square w-1/2 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] shadow-inner overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_72%)] pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-amber-400/80 select-none">
                      {service.name.charAt(0).toUpperCase()}
                    </div>
                    {service.logo ? (
                      <img
                        src={service.logo}
                        alt={`${service.name} icon`}
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        className="absolute inset-0 z-10 h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="px-3 pb-3 flex flex-col min-h-0 flex-1">
                  <h4 className="font-bold text-slate-100 text-sm text-center leading-tight line-clamp-2" title={service.name}>{service.name}</h4>
                  <p className="mt-1.5 text-[11px] text-slate-400 text-center line-clamp-2" title={service.description || 'No description provided.'}>
                    {service.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformsSection({ platforms, loading, onOpenAdd, onEdit, onDelete }) {
  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex-1 flex flex-col min-h-[calc(100vh-12rem)]">
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
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
          <div className="grid grid-cols-4 gap-4 flex-1 overflow-y-auto pr-2 pb-4 content-start">
            {platforms.map(platform => {
              const url = platform.url ? (platform.url.startsWith('http') ? platform.url : `https://${platform.url}`) : null;
              const host = platform.url ? platform.url.replace(/^https?:\/\//, '').replace(/\/.*/, '') : null;
              return (
              <div key={platform.platform_name} className="group relative flex flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] transition-all duration-300 hover:border-emerald-500/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10">
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-400/70 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                <CardActionMenu
                  accent="emerald"
                  onEdit={() => onEdit(platform)}
                  onDelete={() => onDelete(platform.platform_name)}
                />

                <div className="flex justify-center py-3 px-2 pt-8">
                  <div className="relative aspect-square w-1/2 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] shadow-inner overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_72%)] pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-emerald-400/80 select-none">
                      {platform.platform_name.charAt(0).toUpperCase()}
                    </div>
                    {platform.logo ? (
                      <img
                        src={platform.logo}
                        alt={`${platform.platform_name} logo`}
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        className="absolute inset-0 z-10 h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="px-3 pb-3 flex flex-col min-h-0">
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

                {url ? (
                  <div className="flex items-center justify-center px-3 py-2.5 border-t border-white/5 bg-dark-950/30">
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
                  </div>
                ) : null}
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
  profileImage,
  onProfileImageChange,
  onProfileFiles,
  isUploadingProfile,
  onSave,
  hasPassword,
  onSetPassword,
  onChangePassword,
  onNotify
}) {
  const [showAvatarUrlInput, setShowAvatarUrlInput] = useState(false);
  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const [profileImageDraft, setProfileImageDraft] = useState(profileImage);
  const profileInputRef = useRef(null);

  useEffect(() => {
    setProfileImageDraft(profileImage);
  }, [profileImage]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftUsername, setDraftUsername] = useState(currentUser?.username || '');
  const [draftEmail, setDraftEmail] = useState(currentUser?.email || '');

  const username = currentUser?.username || 'User';
  const email = currentUser?.email || '';
  const avatar = currentUser?.avatar || username.charAt(0).toUpperCase();
  const isImageAvatar = isImageUrl(avatar);

  const handleImageChange = async (value) => {
    setProfileImageDraft(value);
    if (!value || isImageUrl(value)) {
      await onProfileImageChange(value);
    }
  };

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
          <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6 flex flex-col">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                {isImageAvatar ? (
                  <img
                    src={avatar}
                    alt={`${username}'s avatar`}
                    className="h-28 w-28 rounded-full object-cover border-2 border-white/10 shadow-2xl shadow-amber-500/10"
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white text-4xl shadow-2xl shadow-amber-500/10">
                    {avatar}
                  </div>
                )}
              </div>

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

            <CloudinaryImageField
              label="Profile Picture"
              value={profileImageDraft}
              onChange={handleImageChange}
              inputRef={profileInputRef}
              isUploading={isUploadingProfile}
              isDragging={isDraggingProfile}
              onDragChange={setIsDraggingProfile}
              onFiles={onProfileFiles}
              showUrlInput={showAvatarUrlInput}
              onToggleUrlInput={() => setShowAvatarUrlInput(prev => !prev)}
              accent="amber"
              previewShape="circle"
              uploadHint="Drag and drop photo, or click to browse"
              dropHint="Drop photo here!"
            />
          </div>

          <PasswordSecurityPanel
            hasPassword={hasPassword}
            onSetPassword={onSetPassword}
            onChangePassword={onChangePassword}
            onNotify={onNotify}
          />
        </div>
      </div>
    </div>
  );
}

function ServiceModal({
  isEditing = false,
  name,
  description,
  logo,
  showLogoUrlInput,
  isUploadingLogo,
  isDraggingLogo,
  logoInputRef,
  onNameChange,
  onDescriptionChange,
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
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Server className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{isEditing ? 'Edit Service' : 'Add New Service'}</h2>
          <p className="text-sm text-slate-400">{isEditing ? 'Update this service category.' : 'Define a new service category for tracking.'}</p>
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

          <CloudinaryImageField
            label="Service Icon"
            value={logo}
            onChange={onLogoChange}
            inputRef={logoInputRef}
            isUploading={isUploadingLogo}
            isDragging={isDraggingLogo}
            onDragChange={onDragChange}
            onFiles={onLogoFiles}
            showUrlInput={showLogoUrlInput}
            onToggleUrlInput={onToggleLogoUrl}
            accent="amber"
            previewShape="square"
            uploadHint="Drag and drop icon, or click to browse"
            dropHint="Drop icon here!"
          />

          <ModalActions onClose={onClose} submitText={isEditing ? 'Save Changes' : 'Create Service'} tone="amber" />
        </form>
      </div>
    </FullScreenModal>
  );
}

function PlatformModal({
  isEditing = false,
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
          <h2 className="text-2xl font-bold text-white mb-2">{isEditing ? 'Edit Platform' : 'Register Platform'}</h2>
          <p className="text-sm text-slate-400">{isEditing ? 'Update platform details and logo.' : 'Add a new platform to map your credentials.'}</p>
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

          <CloudinaryImageField
            label="Platform Logo"
            value={logo}
            onChange={onLogoChange}
            inputRef={logoInputRef}
            isUploading={isUploadingLogo}
            isDragging={isDraggingLogo}
            onDragChange={onDragChange}
            onFiles={onLogoFiles}
            showUrlInput={showLogoUrlInput}
            onToggleUrlInput={onToggleLogoUrl}
            accent="emerald"
            previewShape="square"
            uploadHint="Drag and drop logo, or click to browse"
            dropHint="Drop logo here!"
          />

          <ModalActions onClose={onClose} submitText={isEditing ? 'Save Changes' : 'Register Platform'} tone="emerald" />
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

function CloudinaryImageField({
  label,
  value,
  onChange,
  inputRef,
  isUploading,
  isDragging,
  onDragChange,
  onFiles,
  showUrlInput,
  onToggleUrlInput,
  accent = 'emerald',
  previewShape = 'rounded',
  uploadHint = 'Drag and drop image, or click to browse',
  dropHint = 'Drop image here!',
}) {
  const accentStyles = {
    emerald: {
      previewBorder: 'border-emerald-500/50 bg-emerald-500/5',
      activeBorder: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/60',
      iconActive: 'text-emerald-400',
      link: 'text-emerald-400',
    },
    amber: {
      previewBorder: 'border-amber-500/50 bg-amber-500/5',
      activeBorder: 'border-amber-500 bg-amber-500/10 text-amber-400',
      hoverBorder: 'hover:border-amber-500/60',
      iconActive: 'text-amber-400',
      link: 'text-amber-400',
    },
  };
  const tone = accentStyles[accent] || accentStyles.emerald;

  const renderPreviewImage = () => {
    if (previewShape === 'circle') {
      return (
        <img
          src={value}
          alt={`${label} preview`}
          className="w-20 h-20 rounded-full object-cover mb-2"
        />
      );
    }
    if (previewShape === 'square') {
      return (
        <div className="aspect-square w-36 max-w-full mb-2 relative overflow-hidden rounded-xl bg-slate-950/60 border border-white/10 shadow-inner">
          <img
            src={value}
            alt={`${label} preview`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/10 mb-2 relative overflow-hidden">
        <img
          src={value}
          alt={`${label} preview`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  };

  return (
    <Field label={label}>
      {value ? (
        <div className={`flex flex-col items-center justify-center p-4 border border-dashed ${tone.previewBorder} rounded-xl relative group min-h-[120px]`}>
          {renderPreviewImage()}
          <span className="text-xs text-slate-400 truncate max-w-xs px-2">
            {value.startsWith('data:') ? 'Uploaded custom image' : (isImageUrl(value) ? 'Image ready' : value)}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
            title={`Remove ${label}`}
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
            onFiles(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition duration-200 min-h-[120px] ${
            isDragging
              ? tone.activeBorder
              : `border-slate-700/80 ${tone.hoverBorder} bg-slate-800/20 hover:bg-slate-800/40 text-slate-400`
          }`}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={(event) => onFiles(event.target.files)}
            accept="image/*"
            className="hidden"
          />
          <Image className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? `scale-110 ${tone.iconActive}` : 'text-slate-500'}`} />
          <p className="text-xs font-semibold text-center">
            {isUploading ? 'Uploading to Cloudinary...' : (isDragging ? dropHint : uploadHint)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, SVG (Max 2MB)</p>
        </div>
      )}

      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={onToggleUrlInput}
          className={`text-[11px] ${tone.link} hover:underline`}
        >
          {showUrlInput ? 'Hide URL input' : 'Or paste an image URL instead'}
        </button>
      </div>

      {showUrlInput && (
        <div className="mt-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-4 h-4" />
            </span>
            <input
              type="url"
              placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-200 glass-input text-sm"
            />
          </div>
        </div>
      )}
    </Field>
  );
}

function CardActionMenu({ onEdit, onDelete, accent = 'slate' }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const editHover = accent === 'amber'
    ? 'hover:text-amber-300 hover:bg-amber-500/10'
    : 'hover:text-emerald-300 hover:bg-emerald-500/10';

  return (
    <div ref={menuRef} className="absolute top-2 right-2 z-20">
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); setOpen(prev => !prev); }}
        className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition ${open ? 'opacity-100 bg-white/10 text-slate-200' : 'opacity-70 group-hover:opacity-100'}`}
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 py-1 rounded-xl border border-white/10 bg-dark-950/95 backdrop-blur-md shadow-xl shadow-black/40 z-30 animate-slide-up">
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setOpen(false); onEdit(); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 ${editHover} transition`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
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
            Account passwords are managed through Supabase Auth.
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
