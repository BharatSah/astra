import { useState, useEffect, useCallback } from 'react';
import { fetchServices, createService, updateService, deleteService } from '../models/servicesModel.js';
import { fetchPlatforms, createPlatform, updatePlatform, deletePlatform } from '../models/platformsModel.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

// Controller: system settings (service catalog + platform registry + profile
// avatar upload). Owns CRUD for services/platforms and Cloudinary image uploads.
export function useSettings({ notify }) {
  const [services, setServices] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingServiceLogo, setIsUploadingServiceLogo] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  const refreshServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      setServices(await fetchServices());
    } catch (err) {
      console.error('Error fetching services:', err.message);
      notify('error', 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  }, [notify]);

  const refreshPlatforms = useCallback(async () => {
    setLoadingPlatforms(true);
    try {
      setPlatforms(await fetchPlatforms());
    } catch (err) {
      console.error('Error fetching platforms:', err.message);
      notify('error', 'Failed to load platforms');
    } finally {
      setLoadingPlatforms(false);
    }
  }, [notify]);

  useEffect(() => {
    refreshServices();
    refreshPlatforms();
  }, [refreshServices, refreshPlatforms]);

  const addService = useCallback(async ({ name, description, logo }) => {
    if (!name.trim()) return false;
    try {
      await createService({
        name: name.trim(),
        description: description.trim(),
        logo: (logo || '').trim() || null,
      });
      notify('success', 'Service added successfully');
      await refreshServices();
      return true;
    } catch (err) {
      console.error('Error adding service:', err.message);
      notify('error', err.message.includes('unique') ? 'Service name already exists' : 'Failed to add service');
      return false;
    }
  }, [notify, refreshServices]);

  const editService = useCallback(async (id, { name, description, logo }) => {
    if (!name.trim()) return false;
    try {
      await updateService(id, {
        name: name.trim(),
        description: description.trim(),
        logo: (logo || '').trim() || null,
      });
      notify('success', 'Service updated successfully');
      await refreshServices();
      return true;
    } catch (err) {
      console.error('Error updating service:', err.message);
      notify('error', err.message.includes('unique') ? 'Service name already exists' : 'Failed to update service');
      return false;
    }
  }, [notify, refreshServices]);

  const removeService = useCallback(async (id, name) => {
    if (!confirm(`Are you sure you want to delete the service "${name}"? Customers using this service will lose their association.`)) return false;
    try {
      await deleteService(id);
      notify('success', 'Service deleted successfully');
      await refreshServices();
      return true;
    } catch (err) {
      console.error('Error deleting service:', err.message);
      notify('error', 'Failed to delete service');
      return false;
    }
  }, [notify, refreshServices]);

  const addPlatform = useCallback(async ({ name, url, logo }) => {
    if (!name.trim()) return false;
    try {
      await createPlatform({ platform_name: name.trim(), url: url.trim(), logo: logo.trim() });
      notify('success', 'Platform registry updated');
      await refreshPlatforms();
      return true;
    } catch (err) {
      console.error('Error adding platform:', err.message);
      notify('error', err.message.includes('duplicate') || err.message.includes('primary') ? 'Platform name already registered' : 'Failed to add platform');
      return false;
    }
  }, [notify, refreshPlatforms]);

  const editPlatform = useCallback(async (originalName, { name, url, logo }) => {
    if (!name.trim()) return false;
    try {
      await updatePlatform(originalName, {
        platform_name: name.trim(),
        url: url.trim(),
        logo: (logo || '').trim() || null,
      });
      notify('success', 'Platform updated successfully');
      await refreshPlatforms();
      return true;
    } catch (err) {
      console.error('Error updating platform:', err.message);
      notify('error', err.message.includes('duplicate') || err.message.includes('primary') ? 'Platform name already registered' : 'Failed to update platform');
      return false;
    }
  }, [notify, refreshPlatforms]);

  const removePlatform = useCallback(async (name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? WARNING: All passwords associated with this platform will also be deleted due to constraint dependencies.`)) return false;
    try {
      await deletePlatform(name);
      notify('success', 'Platform removed successfully');
      await refreshPlatforms();
      return true;
    } catch (err) {
      console.error('Error deleting platform:', err.message);
      notify('error', 'Failed to delete platform');
      return false;
    }
  }, [notify, refreshPlatforms]);

  const uploadImage = useCallback(async (file, { uploadingLabel, successLabel, errorLabel }) => {
    if (!file || !file.type.startsWith('image/')) {
      notify('error', 'Only image files (PNG, JPG, SVG, etc.) are supported.');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      notify('error', 'File size exceeds 2MB limit.');
      return null;
    }
    uploadingLabel(true);
    try {
      const url = await uploadToCloudinary(file);
      notify('success', successLabel);
      return url;
    } catch (err) {
      console.error('Cloudinary upload error:', err.message);
      notify('error', err.message || errorLabel);
      return null;
    } finally {
      uploadingLabel(false);
    }
  }, [notify]);

  const uploadLogo = useCallback(async (file) => {
    return uploadImage(file, {
      uploadingLabel: setIsUploadingLogo,
      successLabel: 'Logo uploaded to Cloudinary successfully',
      errorLabel: 'Failed to upload logo.',
    });
  }, [uploadImage]);

  const uploadServiceLogo = useCallback(async (file) => {
    return uploadImage(file, {
      uploadingLabel: setIsUploadingServiceLogo,
      successLabel: 'Service icon uploaded to Cloudinary successfully',
      errorLabel: 'Failed to upload service icon.',
    });
  }, [uploadImage]);

  const uploadProfileImage = useCallback(async (file) => {
    return uploadImage(file, {
      uploadingLabel: setIsUploadingProfile,
      successLabel: 'Profile image uploaded to Cloudinary successfully',
      errorLabel: 'Failed to upload profile image.',
    });
  }, [uploadImage]);

  return {
    services, platforms, loadingServices, loadingPlatforms,
    isUploadingLogo, isUploadingServiceLogo, isUploadingProfile,
    refreshServices, refreshPlatforms,
    addService, editService, removeService, addPlatform, editPlatform, removePlatform,
    uploadLogo, uploadServiceLogo, uploadProfileImage
  };
}