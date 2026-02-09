import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { setAuthToken } from '../services/apiClient';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. BOOTSTRAP: Check Session on App Load ---
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        
        if (!storedToken) {
          setAuthToken(null);
          setUser(null);
          setLoading(false);
          return; // Stop here. Navigation is handled by ProtectedRoute.
        }

        setAuthToken(storedToken);
        
        // Fetch full profile on restore to get role/avatar
        const userRes = await apiClient.get('/users/me');
        setUser(userRes.data.data);

      } catch (error) {
        console.log("ℹ️ Session invalid or expired");
        setAuthToken(null); 
        setUser(null);
        localStorage.removeItem('accessToken'); 
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []); 

  // --- 2. LOGIN ACTION ---
  const login = async (credentials) => {
    try {
      const { data: loginData } = await apiClient.post('/users/login', credentials);
      const { token } = loginData.data;

      setAuthToken(token); 

      // Fetch full profile immediately
      const userRes = await apiClient.get('/users/me');
      setUser(userRes.data.data);
      
      return { success: true };

    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      return { success: false, error: msg };
    }
  };

  // --- 3. LOGOUT ACTION ---
  const logout = async () => {
    try {
      await apiClient.post('/users/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setAuthToken(null); 
      setUser(null);
      toast.info("Logged out successfully");
      // Force reload/redirect to ensure all states are cleared
      window.location.href = '/login'; 
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      role: user?.role || null,
      loading, 
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      login, 
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};