import React from 'react';
import { User } from 'lucide-react';

const PreviewRow = ({ data, image, rjNames, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`group flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden border shadow-md w-full transition-colors duration-300
      ${isDark ? 'bg-gray-900 border-white/5 hover:bg-gray-800/50' : 'bg-white border-gray-200 hover:bg-gray-50'}
    `}>
      
      {/* Time Column */}
      <div className={`w-full md:w-24 flex flex-row md:flex-col items-center justify-between md:justify-center p-4 md:p-0 border-b md:border-b-0 md:border-r gap-1 shrink-0 
        ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-gray-50'}
      `}>
        <div className="text-center">
          <span className={`block text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>10:00</span>
          <span className={`block text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>PM</span>
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-bold uppercase tracking-widest truncate mr-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {rjNames || "ByteCast Bot"}
          </span>
          {data.guestName && (
            <span className="flex items-center gap-1 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded font-bold tracking-wide">
              <User size={9} fill="currentColor" /> FEAT. {data.guestName.toUpperCase()}
            </span>
          )}
        </div>
        <h3 className={`text-xl font-serif mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {data.title || "Show Title"}
        </h3>
        <p className={`text-xs line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {data.tagline || "Tagline..."}
        </p>
      </div>
      
      {/* Image Column */}
      <div className={`hidden md:flex w-32 relative shrink-0 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div 
            className="absolute inset-0 opacity-60 blur-lg scale-110" 
            style={{ backgroundImage: `url(${image || "https://via.placeholder.com/800x800"})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
          />
          <img 
            src={image || "https://via.placeholder.com/800x800"} 
            className="absolute inset-0 w-full h-full object-contain z-10 opacity-90 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-300" 
            alt="" 
          />
      </div>
    </div>
  );
};

export default PreviewRow;