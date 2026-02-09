import apiClient from './apiClient'; // Import the smart client

// Helper to build FormData automatically
const createFormData = (data, files, fileKey) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => formData.append(key, data[key]));
  
  if (files) {
    if (files.length !== undefined) {
      Array.from(files).forEach(file => formData.append(fileKey, file));
    } else {
      formData.append(fileKey, files);
    }
  }
  return formData;
};

export const RjAPI = {
  getAll: () => apiClient.get('/rjs'),
  delete: (id) => apiClient.delete(`/rjs/${id}`),
  create: (data, files) => apiClient.post('/rjs', createFormData(data, files, 'photo'), {
    headers: { 'Content-Type': 'multipart/form-data' } // Override for files
  }),
  update: (id, data, files) => apiClient.put(`/rjs/${id}`, createFormData(data, files, 'photo'), {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const ShowAPI = {
  getAll: () => apiClient.get('/shows'),
  delete: (id) => apiClient.delete(`/shows/${id}`),
  create: (data, file) => apiClient.post('/shows', createFormData(data, file, 'CoverImage'), {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data, file) => apiClient.put(`/shows/${id}`, createFormData(data, file, 'CoverImage'), {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ... ScheduleAPI follows the same pattern
export const ScheduleAPI = {
  // We usually fetch schedules via the Show, but this is useful for debugging
  getAll: () => apiClient.get('/weekly-schedules'),
  
  // Create a schedule linked to a show
  // Data: { startTime, endTime, day, show: showId }
  create: (data) => apiClient.post('/weekly-schedules', data),
  
  // Update a specific time slot
  update: (id, data) => apiClient.put(`/weekly-schedules/${id}`, data),
  
  // Delete a time slot
  delete: (id) => apiClient.delete(`/weekly-schedules/${id}`),
};