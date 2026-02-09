import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export default function AppearanceSettings() {
  const { toggleTheme, resolvedTheme, themeName, themeMode } = useTheme(); 

  const effectiveTheme = resolvedTheme || themeName || themeMode;
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold mb-1">Appearance</h3>
        <p className="text-sm text-[var(--text-secondary)]">Customize the look and feel of your workspace.</p>
      </div>

      <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-colors duration-300 ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-500'}`}>
                {isDark ? <Moon size={24} /> : <Sun size={24} />}
            </div>
            <div>
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    {isDark ? "Dark Mode" : "Light Mode"}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isDark ? "Switch to light mode" : "Switch to dark mode"}
                </p>
            </div>
        </div>

        <button 
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out flex items-center px-1
                ${isDark ? 'bg-[var(--accent-color)]' : 'bg-gray-300 dark:bg-gray-600'}
            `}
        >
            <div 
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out
                ${isDark ? 'translate-x-6' : 'translate-x-0'}
            `}/>
        </button>
      </div>
    </div>
  );
}