import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../styles/themeConstants';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  // Apply CSS variables to DOM (keeps global styles working)
  useEffect(() => {
    const theme = themes[themeName];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme)) {
      root.style.setProperty(key, value);
    }
    localStorage.setItem('app-theme', themeName);
  }, [themeName]);

  const toggleTheme = () => {
    setThemeName((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ 
      themeName, 
      toggleTheme, 
      // 👇 NEW: Pass the actual theme object directly
      currentTheme: themes[themeName] 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};