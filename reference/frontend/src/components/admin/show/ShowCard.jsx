import React from 'react';
import { Clock, Edit2, Trash2, Mic2 } from 'lucide-react';
import { DAYS } from '../../../utils/showUtils';

const ShowCard = ({ show, onEdit, onSchedule, onDelete, onView }) => {

  const getDisplayHosts = () => {
    const uniqueHosts = new Set();
    if (show.rjs && Array.isArray(show.rjs)) {
      show.rjs.forEach(rj => rj?.name && uniqueHosts.add(rj.name));
    }
    if (show.weekly_schedules && Array.isArray(show.weekly_schedules)) {
      show.weekly_schedules.forEach(slot => slot.rj?.name && uniqueHosts.add(slot.rj.name));
    }
    const hostsArray = Array.from(uniqueHosts);
    return hostsArray.length > 0 ? hostsArray.join(', ') : "Unassigned";
  };

  const displayHosts = getDisplayHosts();

  return (
    <div 
      onClick={() => onView(show)}
      className="
        group relative flex flex-col w-full h-full
        rounded-2xl border transition-all duration-300 ease-out
        hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden
        bg-[var(--bg-card)] border-[var(--border-color)]
      "
    >
      {/* --- TOP: COVER IMAGE (16:9 Aspect Ratio) --- */}
      <div className="relative w-full aspect-video shrink-0 bg-[var(--bg-secondary)] overflow-hidden">
        
        {/* 1. Blurred Background */}
        <div 
          className="absolute inset-0 opacity-50 blur-2xl scale-110"
          style={{ 
            backgroundImage: `url(${show.coverImage})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }} 
        />

        {/* 2. Main Image */}
        <img 
          src={show.coverImage} 
          alt={show.title} 
          className="relative w-full h-full object-contain z-10" 
        />
        
        {/* 3. Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-20" />

        {/* Live Badge */}
        {show.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 shadow-md z-30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[10px] font-bold text-white tracking-wide">LIVE</span>
          </div>
        )}

        {/* DESKTOP ACTIONS */}
        <div 
          className="hidden lg:flex absolute top-3 right-3 items-center gap-1 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg">
              <DesktopButton onClick={() => onSchedule(show)} icon={<Clock size={16} />} />
              <DesktopButton onClick={() => onEdit(show)} icon={<Edit2 size={16} />} />
              <DesktopButton onClick={() => onDelete(show._id)} icon={<Trash2 size={16} />} isDanger />
          </div>
        </div>
      </div>

      {/* --- BOTTOM: CONTENT --- */}
      <div className="flex flex-col flex-1 p-5">
        
        <div className="mb-4">
          <h3 className="text-lg font-bold truncate leading-tight mb-1 text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
            {show.title}
          </h3>
          <p className="text-sm font-medium opacity-60 truncate text-[var(--text-secondary)]">
            {show.tagline}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] w-full">
            <Mic2 size={14} className="text-[var(--accent-color)] shrink-0" />
            <span className={`text-xs font-semibold truncate text-[var(--text-primary)] flex-1 min-w-0 ${displayHosts === "Unassigned" ? "opacity-50 italic" : ""}`}>
              {displayHosts}
            </span>
          </div>
        </div>

        {/* Footer: Timeline (FIXED VISIBILITY) */}
        <div className="mt-5 pt-4 border-t border-[var(--border-color)]">
          <div className="flex flex-col gap-2">
            
            {/* Day Labels - Removed opacity, increased weight */}
            <div className="flex justify-between px-1">
              {DAYS.map(day => (
                <span key={day} className="text-[10px] font-extrabold uppercase text-[var(--text-secondary)]">
                  {day.substring(0, 1)}
                </span>
              ))}
            </div>

            {/* Timeline Track - Uses concrete gray color for better contrast in light mode */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
              {DAYS.map(day => {
                const active = show.weekly_schedules?.some(s => s.day === day);
                return (
                  <div 
                    key={day} 
                    className="flex-1 border-r border-[var(--bg-card)] last:border-0 transition-colors duration-300"
                    style={{ backgroundColor: active ? 'var(--accent-color)' : 'transparent' }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* MOBILE ACTIONS */}
        <div 
          className="flex lg:hidden items-center gap-2 mt-5 pt-3 border-t border-[var(--border-color)]"
          onClick={(e) => e.stopPropagation()}
        >
          <MobileButton onClick={() => onSchedule(show)} icon={<Clock size={14}/>} label="Schedule" />
          <MobileButton onClick={() => onEdit(show)} icon={<Edit2 size={14}/>} label="Edit" />
          <MobileButton onClick={() => onDelete(show._id)} icon={<Trash2 size={14}/>} isDanger />
        </div>

      </div>
    </div>
  );
};

// --- HELPERS ---

const DesktopButton = ({ onClick, icon, isDanger }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`
      p-2 rounded-md transition-all duration-200 text-white
      hover:bg-white/20 active:scale-95
      ${isDanger ? 'hover:text-red-400' : 'hover:text-blue-400'}
    `}
  >
    {icon}
  </button>
);

const MobileButton = ({ onClick, icon, label, isDanger }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`
      flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-transform active:scale-95
      ${isDanger 
        ? 'border-red-500/30 bg-red-500/10 text-red-500' 
        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
      }
    `}
  >
    {icon} 
    {label && <span>{label}</span>}
  </button>
);

export default ShowCard;