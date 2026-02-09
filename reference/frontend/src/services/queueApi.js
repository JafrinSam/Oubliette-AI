import axios from 'axios';

const API_URL = 'http://localhost:5000/api/queue'; // Adjust port if needed

export const queueApi = {
  // Get current queue status
  getStatus: async () => {
    const response = await axios.get(`${API_URL}/status`);
    return response.data; // Expected: { command, queue: [] }
  },

  // Add a song to the queue
  add: async (filename) => {
    const response = await axios.post(`${API_URL}/add`, { filename });
    return response.data;
  },

  // Skip the current song
  skip: async () => {
    const response = await axios.post(`${API_URL}/skip`);
    return response.data;
  }
};