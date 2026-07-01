-- Add logo column to services (mirrors platforms.logo for Cloudinary image URLs)
ALTER TABLE services ADD COLUMN IF NOT EXISTS logo TEXT;
