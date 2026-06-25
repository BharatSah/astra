/**
 * Cloudinary Image Upload Utility
 * Performs client-side unsigned uploads to Cloudinary using configuration variables from env.
 */

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'evgtezy9';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Astra_image';

/**
 * Returns true for any value that should render as an <img>:
 * base64 data URLs (data:image/...) or http(s) URLs (incl. Cloudinary).
 */
export function isImageUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('data:image/') || /^https?:\/\//i.test(value);
}

/**
 * Uploads an image file to Cloudinary via unsigned upload preset.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} secure_url of the uploaded image.
 */
export async function uploadToCloudinary(file) {
  if (!cloudName) {
    throw new Error('Cloudinary Cloud Name is not configured');
  }
  if (!uploadPreset) {
    throw new Error('Cloudinary Upload Preset is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let message = 'Failed to upload image to Cloudinary';
    try {
      const errorData = await response.json();
      message = errorData.error?.message || message;
    } catch {
      /* response body was not JSON; fall back to default message */
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.secure_url;
}