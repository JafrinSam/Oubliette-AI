import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

const useFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store the AbortController to cancel active requests
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (method, url, payload = null, options = {}) => {
    const { 
      showToast = true, 
      successMessage = "Operation successful", 
      errorMessage = null, 
      headers = {},
      params = {} 
    } = options;

    // 1. Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Create new controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const config = {
        method,
        url,
        data: payload,
        headers: { ...headers },
        params,
        signal // Attach signal to axios config
      };

      if (payload instanceof FormData) {
        config.headers['Content-Type'] = undefined;
      }

      const response = await apiClient(config);
      const result = response.data;

      setData(result);
      
      if (showToast && method !== 'GET') {
        toast.success(successMessage || result.message);
      }

      return { success: true, data: result };

    } catch (err) {
      // 3. Ignore errors caused by cancellation
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // console.log('Request canceled', url);
        return { success: false, isCanceled: true };
      }

      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || "Something went wrong";
      const displayMsg = errorMessage || serverMsg; 

      setError(displayMsg);

      const isSessionDeath = status === 401 || (status === 403 && !serverMsg.toLowerCase().includes("access denied"));

      if (showToast && !isSessionDeath) {
        toast.error(displayMsg);
      }

      return { success: false, error: displayMsg };

    } finally {
      // Only turn off loading if the current request wasn't cancelled
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper to clear state manually
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const get = useCallback((url, options) => execute('GET', url, null, { showToast: false, ...options }), [execute]);
  const post = useCallback((url, data, options) => execute('POST', url, data, options), [execute]);
  const put = useCallback((url, data, options) => execute('PUT', url, data, options), [execute]);
  const del = useCallback((url, options) => execute('DELETE', url, null, options), [execute]);

  return { 
    data, 
    loading, 
    error, 
    reset, // New export
    execute, 
    get, 
    post, 
    put, 
    del 
  };
};

export default useFetch;