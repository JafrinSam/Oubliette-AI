// src/utils/strapi.js

// Change this to your production URL when deploying
const STRAPI_BASE_URL = "http://localhost:1337";

/**
 * Helper to extract the image URL from a Strapi media field.
 * Handles both v4/v5 structures and array/object formats.
 */
export const getStrapiImage = (imageField) => {
  if (!imageField) return null;

  // 1. Handle Array vs Object (Strapi sometimes returns an array for single media)
  const image = Array.isArray(imageField) ? imageField[0] : imageField;

  // 2. Check if URL exists
  if (!image?.url) return null;

  // 3. Return absolute URL
  // If it's already a full URL (Cloudinary/AWS), return it.
  if (image.url.startsWith('http')) {
    return image.url;
  }

  // If it's relative (/uploads/img.png), prepend the Strapi Base URL.
  return `${STRAPI_BASE_URL}${image.url}`;
};