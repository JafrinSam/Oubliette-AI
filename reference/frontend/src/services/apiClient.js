// src/services/apiClient.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Just the base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', 
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});



export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
  }
};

export default apiClient;