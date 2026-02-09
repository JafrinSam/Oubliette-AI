import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useStationStats } from '../../hooks/useStationStats';
import { useAuth } from '../../context/AuthContext';
import GlassSurface from '../utils/GlassSurface';
import { 
  LayoutDashboard, CalendarClock, Mic2, Users, 
  Settings, LogOut, Radio, BarChart3, ChevronRight, 
  CalendarDays 
} from 'lucide-react';

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeName } = useTheme();
  
  // 1. Get User Role
  const { user, logout } = useAuth();
  const userRole = user?.role; 

  const { listeners, isLive } = useStationStats();
  const isDark = themeName === 'dark';

  // 2. Define Menu Structure with Permissions
  const navStructure = [
    {
      label: 'Broadcast',
      items: [
        { 
            path: '/admin', 
            icon: LayoutDashboard, 
            label: 'Studio', 
            allowed: ['admin', 'super_admin', 'event_manager'] 
        },
        { 
            path: '/admin/show', 
            icon: CalendarClock, 
            label: 'Schedule', 
            allowed: ['admin', 'super_admin'] 
        },
        { 
            path: '/admin/rjs', 
            icon: Mic2, 
            label: 'RJs & Shows', 
            allowed: ['admin', 'super_admin'] 
        },
      ]
    },
    {
      label: 'Management',
      items: [
        { 
            path: '/admin/events', 
            icon: CalendarDays, 
            label: 'Events', 
            allowed: ['admin', 'super_admin', 'event_manager'] 
        },
        { 
            path: '/admin/users', 
            icon: Users, 
            label: 'Team', 
            allowed: ['admin', 'super_admin'] 
        },
        { 
            path: '/admin/analytics', 
            icon: BarChart3, 
            label: 'Analytics', 
            allowed: ['admin', 'super_admin'] 
        },
        { 
            path: '/admin/settings', 
            icon: Settings, 
            label: 'Settings', 
            allowed: ['admin', 'super_admin', 'event_manager'] 
        },
      ]
    }
  ];

  // 3. Filter Navigation based on Role
  const filteredNavGroups = navStructure.map(group => ({
    ...group,
    items: group.items.filter(item => item.allowed.includes(userRole))
  })).filter(group => group.items.length > 0); // Hide empty sections

  const handleLogout = async () => {
    await logout();
    closeSidebar();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={0}
          isDark={isDark}
          blur={24}
          opacity={isDark ? 0.9 : 0.95}
          borderWidth={0}
          className="border-r border-white/5 h-full overflow-hidden" 
        >
          {/* MAIN FLEX LAYOUT */}
          <div className="flex flex-col h-full w-full">
            
            {/* SECTION 1: SCROLLABLE NAVIGATION */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar py-6 px-3 space-y-6">
              {filteredNavGroups.map((group, idx) => (
                <div key={idx}>
                  <h3 className="px-4 text-[10px] font-bold text-secondary/50 uppercase tracking-widest mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = item.path === '/admin' 
                        ? location.pathname === '/admin' 
                        : location.pathname.startsWith(item.path);

                      return (
                        <Link 
                          key={item.path} 
                          to={item.path} 
                          onClick={closeSidebar}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                            isActive 
                              ? 'text-white bg-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20 font-medium' 
                              : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={18} className={isActive ? "animate-pulse" : "opacity-70 group-hover:opacity-100"} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {isActive && <ChevronRight size={14} className="opacity-80" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 2: BOTTOM FOOTER (Widget & Logout) */}
            <div className="shrink-0 p-4 border-t border-white/5 bg-black/5 dark:bg-black/20 z-10 backdrop-blur-md">
              
              {/* FIXED WIDGET */}
              <div className="mb-3 p-4 rounded-xl bg-gradient-to-br from-[#18181b] to-[#09090b] border border-white/10 relative overflow-hidden group shadow-lg">
                <div className="absolute inset-0 bg-[var(--accent-color)]/5 group-hover:bg-[var(--accent-color)]/10 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
                      <Radio size={14} className="text-[var(--accent-color)]" />
                    </div>
                    <span className="text-xs font-semibold text-white/80">Station ID</span>
                  </div>
                  
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    isLive 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    {isLive ? 'Live' : 'Auto'}
                  </div>
                </div>
                
                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-white/50 font-medium uppercase tracking-wide mb-0.5">Listeners</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-bold text-white/90">{listeners.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-0.5 pb-1 opacity-40">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-[var(--accent-color)] rounded-t-sm animate-pulse" 
                        style={{ 
                          height: `${Math.random() * 12 + 4}px`,
                          animationDelay: `${i * 0.15}s` 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* LOGOUT BUTTON */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 border border-transparent transition-all duration-200 font-medium text-sm group"
              >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Sign Out</span>
              </button>

            </div>

          </div>
        </GlassSurface>
      </aside>
    </>
  );
}