import { handleResponse } from "./handleResponse";

const API_BASE_URL = 'http://localhost:5000/api';


// src/services/assetApi.js


export const assetApi = {
  /**
   * Fetch all music assets
   */
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/file`);
    return handleResponse(response);
  },

  /**
   * Upload music files (Multipart Form Data)
   * @param {File[]} files Array of file objects from input
   */
  upload: async (files) => {
    const formData = new FormData();
    // Append each file to the 'musicFiles' field expected by Multer
    Array.from(files).forEach((file) => {
      formData.append('musicFiles', file);
    });

    const response = await fetch(`${API_BASE_URL}/file/upload`, {
      method: 'POST',
      body: formData, // Browser automatically sets Content-Type to multipart/form-data
    });
    return handleResponse(response);
  },

  /**
   * Update asset metadata
   * @param {string} id Asset ID
   * @param {Object} data { artist, title, originalName }
   */
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/file/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete asset (DB + File)
   * @param {string} id Asset ID
   */
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/file/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};