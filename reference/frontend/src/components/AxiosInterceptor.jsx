// src/components/AxiosInterceptor.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

const AxiosInterceptor = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Request Interceptor (Attach Token & Device ID)
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        
        // We can access localStorage directly here, or get device_id from a helper
        let deviceId = localStorage.getItem('device_id');
        if (config.headers) {
             config.headers['x-device-id'] = deviceId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Response Interceptor (Handle 401/403 & Refresh)
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => {
        const newAccessToken = response.headers['x-new-access-token'];
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return response;
      },
      async (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || "Session expired.";

        if (status === 401 || (status === 403 && !msg.includes("Access denied"))) {
           // ✅ WE CAN USE NAVIGATE DIRECTLY HERE!
           localStorage.removeItem('accessToken');
           toast.error(msg);
           navigate('/login'); 
        }

        return Promise.reject(error);
      }
    );

    // Cleanup: Remove interceptors when the app unmounts
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  return children;
};

export default AxiosInterceptor;