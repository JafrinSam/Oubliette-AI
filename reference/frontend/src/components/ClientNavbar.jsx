import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Home, Info, Radio, Calendar, Menu, X } from 'lucide-react'; 
import GlassSurface from './utils/GlassSurface';

// IMPORT YOUR NEW LOGO COMPONENT HERE
import ByteCastLogo from './utils/ByteCastLogo'; // Adjust path if needed

export default function ClientNavbar() {
  const { themeName, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation(); 

  const closeMenu = () => setIsOpen(false);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all group relative z-10";
    
    return isActive 
      ? `${baseClass} text-accent bg-accent/10 font-bold shadow-sm ring-1 ring-accent/20` 
      : `${baseClass} text-secondary hover:text-accent hover:bg-white/10`;
  };

  const getMobileLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors";
    
    return isActive
      ? `${baseClass} text-accent bg-accent/10 font-bold border-l-4 border-accent`
      : `${baseClass} text-secondary hover:text-accent hover:bg-white/5`;
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl transition-all duration-300">
        <GlassSurface
            width="100%"
            height="auto"
            borderRadius={40}
            borderWidth={0}
            backgroundOpacity={themeName === 'light' ? 0.5 : 0.6} 
            blur={20}
            isStepped={false}
            isDark={themeName === 'dark'} 
            className="shadow-2xl border border-white/10"
        >
            <div className="w-full">
                <div className="px-6 sm:px-8">
                    <div className="flex justify-between items-center h-16">
                    
                        {/* --- BRANDING / LOGO --- */}
                        <Link to="/" onClick={closeMenu} className="flex-shrink-0 flex items-center gap-3 group cursor-pointer z-50">
                            {/* Logo Container */}
                            <div className="h-10 w-10 relative flex items-center justify-center rounded-full bg-white/5 p-1 overflow-visible">
                                {/* Using the new Vector Component */}
                                <ByteCastLogo width="100%" height="100%" />
                            </div>
                            
                            <div className="flex flex-col">
                                <h1 className="text-xl tracking-wide text-accent font-magilio leading-none">
                                    ByteCast
                                </h1>
                                <span className="text-[10px] text-secondary font-medium tracking-[0.2em] uppercase">
                                    FM
                                </span>
                            </div>
                        </Link>

                        {/* --- DESKTOP NAVIGATION --- */}
                        <div className="hidden md:flex items-center space-x-1">
                            <Link to="/" className={getLinkClass('/')}>
                                <Home size={16} className={location.pathname === '/' ? "text-accent" : "group-hover:text-accent transition-colors"} />
                                Home
                            </Link>

                            <Link to="/live" className={getLinkClass('/live')}>
                                <Radio size={16} className={location.pathname === '/live' ? "text-accent" : "group-hover:text-accent transition-colors"} />
                                Live
                            </Link>

                            <Link to="/schedule" className={getLinkClass('/schedule')}>
                                <Calendar size={16} className={location.pathname === '/schedule' ? "text-accent" : "group-hover:text-accent transition-colors"} />
                                Schedule
                            </Link>
                            
                            <Link to="/about" className={getLinkClass('/about')}>
                                <Info size={16} className={location.pathname === '/about' ? "text-accent" : "group-hover:text-accent transition-colors"} />
                                About
                            </Link>

                            <div className="w-px h-5 bg-white/10 mx-3"></div>

                            {/* Listen Badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold animate-pulse cursor-default select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>ON AIR</span>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="ml-2 p-2 rounded-full bg-white/5 border border-white/10 text-primary hover:text-accent hover:border-accent transition-all shadow-sm flex items-center justify-center backdrop-blur-sm"
                                title="Toggle Theme"
                            >
                                {themeName === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>

                        {/* --- MOBILE CONTROLS --- */}
                        <div className="flex md:hidden items-center gap-3">
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="hidden xs:inline">LIVE</span>
                            </div>

                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-full bg-white/5 text-secondary hover:text-accent focus:outline-none transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- MOBILE DROPDOWN MENU --- */}
                <div 
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] border-t border-white/5 ${
                    isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="px-6 pt-4 pb-6 space-y-2 flex flex-col">
                        <Link to="/" onClick={closeMenu} className={getMobileLinkClass('/')}>
                            <Home size={18} /> Home
                        </Link>
                        <Link to="/live" onClick={closeMenu} className={getMobileLinkClass('/live')}>
                            <Radio size={18} /> Live Stream
                        </Link>
                        
                        <Link to="/schedule" onClick={closeMenu} className={getMobileLinkClass('/schedule')}>
                            <Calendar size={18} /> Schedule
                        </Link>

                        <Link to="/about" onClick={closeMenu} className={getMobileLinkClass('/about')}>
                            <Info size={18} /> About
                        </Link>

                        <div className="flex items-center justify-between px-4 py-3 mt-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-sm text-secondary font-medium">Appearance</span>
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/10 text-primary hover:border-accent transition-all text-xs font-bold"
                            >
                                {themeName === 'light' ? (
                                    <><Moon size={14} /> <span>Dark</span></>
                                ) : (
                                    <><Sun size={14} /> <span>Light</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </GlassSurface>
    </div>
  );
}