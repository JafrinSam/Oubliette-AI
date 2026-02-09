import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useStationStats } from '../../hooks/useStationStats';
import { useAuth } from '../../context/AuthContext'; // 👈 Import Auth
import GlassSurface from '../utils/GlassSurface'; 
import { Radio, Sun, Moon, Menu, Bell } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { themeName, toggleTheme } = useTheme();
  const { isLive, listeners } = useStationStats();
  const { user } = useAuth(); // Get current user
  const isDark = themeName === 'dark';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={0}
        isDark={isDark}
        blur={24} // Higher blur for premium feel
        opacity={isDark ? 0.8 : 0.9}
        borderWidth={0}
        className="border-b border-white/5 shadow-sm"
      >
        <div className="w-full h-full px-4 lg:px-6 flex justify-between items-center">
          
          {/* LEFT: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-secondary hover:text-accent transition-colors active:scale-95"
            >
              <Menu size={24} />
            </button>

            <Link to="/admin" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="h-9 w-9 bg-gradient-to-br from-[var(--accent-color)] to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-[var(--accent-color)]/20 transition-all duration-500 group-hover:rotate-6">
                   <Radio size={18} />
                </div>
                {/* Ping animation if live */}
                {isLive && <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>}
              </div>
              <div className="flex flex-col leading-none">
                <h1 className="text-xl font-black tracking-tight text-primary font-sans">
                  Byte<span className="text-[var(--accent-color)]">Cast</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Studio Console</span>
              </div>
            </Link>
          </div>

          {/* RIGHT: Actions & User */}
          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Live Status Pill */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide transition-colors ${
              isLive 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{isLive ? `LIVE (${listeners})` : `AutoDJ (${listeners})`}</span>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent-color)] rounded-full ring-2 ring-[var(--bg-card)]"></span>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary transition-colors"
              >
                {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-black/5 dark:bg-white/10"></div>

            {/* User Profile */}
            <Link to="/admin/settings" className="flex items-center gap-3 pl-1 group cursor-pointer">
              <div className="hidden md:flex flex-col items-end leading-none">
                <span className="text-sm font-bold text-primary">{user?.name || 'Admin'}</span>
                <span className="text-[10px] text-secondary font-medium uppercase tracking-wide">{user?.role?.replace('_', ' ') || 'Staff'}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 border-2 border-white/20 shadow-sm overflow-hidden">
                 {user?.avatar ? (
                   <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-xs font-bold opacity-50">
                     {user?.name?.charAt(0) || 'A'}
                   </div>
                 )}
              </div>
            </Link>

          </div>

        </div>
      </GlassSurface>
    </header>
  );
}