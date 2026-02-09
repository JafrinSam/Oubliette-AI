import { handleResponse } from "./handleResponse";

// Change this if you deploy to production
const API_BASE_URL = 'http://localhost:1337/api';

export const eventApi = {
  /**
   * Fetch all events sorted by date (Ascending)
   */
  getAll: async () => {
    // Strapi sorting syntax: ?sort=field:order
    const response = await fetch(`${API_BASE_URL}/college-events?sort=date:asc&populate=*`);
    return handleResponse(response);
  },

  /**
   * Get a single event by Document ID
   * @param {string} documentId 
   */
  getById: async (documentId) => {
    const response = await fetch(`${API_BASE_URL}/college-events/${documentId}`);
    return handleResponse(response);
  },

  /**
   * Create a new event (For your Admin Panel)
   * @param {Object} eventData 
   */
/*   create: async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: eventData }), // Strapi requires payload wrapped in "data"
    });
    return handleResponse(response);
  },
 */
  /**
   * Update an event
   * @param {string} documentId 
   * @param {Object} eventData 
   */
/*   update: async (documentId, eventData) => {
    const response = await fetch(`${API_BASE_URL}/events/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: eventData }),
    });
    return handleResponse(response);
  }, */

  /**
   * Delete an event
   * @param {string} documentId 
   */
/*   delete: async (documentId) => {
    const response = await fetch(`${API_BASE_URL}/events/${documentId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }, */
};