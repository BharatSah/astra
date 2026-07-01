import { useState, useEffect, useCallback } from 'react';
import { fetchServices, createService, deleteService } from '../models/servicesModel.js';
import { fetchPlatforms, createPlatform, deletePlatform } from '../models/platformsModel.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

// Controller: system settings (service catalog + platform registry + profile
// avatar upload). Owns CRUD for services/platforms and Cloudinary image uploads.
export function useSettings({ notify }) {
  const [services, setServices] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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

  const addService = useCallback(async (name, description) => {
    if (!name.trim()) return false;
    try {
      await createService({ name: name.trim(), description: description.trim() });
      notify('success', 'Service added successfully');
      await refreshServices();
      return true;
    } catch (err) {
      console.error('Error adding service:', err.message);
      notify('error', err.message.includes('unique') ? 'Service name already exists' : 'Failed to add service');
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

  const uploadLogo = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      notify('error', 'Only image files (PNG, JPG, SVG, etc.) are supported.');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      notify('error', 'File size exceeds 2MB limit.');
      return null;
    }
    setIsUploadingLogo(true);
    try {
      const url = await uploadToCloudinary(file);
      notify('success', 'Logo uploaded to Cloudinary successfully');
      return url;
    } catch (err) {
      console.error('Cloudinary upload error:', err.message);
      notify('error', err.message || 'Failed to upload logo.');
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  }, [notify]);

  const uploadProfileImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      notify('error', 'Only image files (PNG, JPG, SVG, etc.) are supported.');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      notify('error', 'File size exceeds 2MB limit.');
      return null;
    }
    setIsUploadingProfile(true);
    try {
      const url = await uploadToCloudinary(file);
      notify('success', 'Profile image uploaded to Cloudinary successfully');
      return url;
    } catch (err) {
      console.error('Cloudinary upload error:', err.message);
      notify('error', err.message || 'Failed to upload profile image.');
      return null;
    } finally {
      setIsUploadingProfile(false);
    }
  }, [notify]);

  return {
    services, platforms, loadingServices, loadingPlatforms, isUploadingLogo, isUploadingProfile,
    refreshServices, refreshPlatforms,
    addService, removeService, addPlatform, removePlatform,
    uploadLogo, uploadProfileImage
  };
}