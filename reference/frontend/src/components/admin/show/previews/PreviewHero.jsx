import React from 'react';
import { Calendar, Clock, Star, Radio } from 'lucide-react';

const PreviewHero = ({ data, image, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`relative overflow-hidden rounded-[2rem] shadow-2xl group w-full border transition-colors duration-300
      ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}
    `}>
      <div className="flex flex-col md:flex-row h-full items-stretch">
        
        {/* Content Side */}
        <div className="p-8 flex-1 flex flex-col justify-center relative z-20">
          
          {/* Top Badges */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 
              ${data.hit ? 'text-orange-500' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
              {data.hit ? <><Star size={12} fill="currentColor" /> Trending Hit</> : <><Clock size={12} /> Upcoming Show</>}
            </span>
            {data.isLive && (
              <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                <Radio size={10} className="animate-pulse" /> LIVE
              </span>
            )}
          </div>

          {/* Title & Tagline */}
          <h2 className={`text-3xl md:text-4xl font-serif leading-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {data.title || "Show Title"}
          </h2>
          <p className={`text-sm mb-6 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.tagline || "Show tagline goes here..."}
          </p>
          
          {/* Metadata Chips */}
          <div className={`flex flex-wrap items-center gap-3 mb-6 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              <Calendar size={14} /> Daily
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              <Clock size={14} /> 10:00 PM
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex items-center gap-4">
            <button className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-orange-500/20 text-sm hover:bg-orange-600 transition-colors">
              Listen Now
            </button>
          </div>
        </div>

        {/* Image Side */}
        <div className={`w-full md:w-1/2 relative min-h-[250px] md:min-h-0 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div 
            className="absolute inset-0 opacity-50 blur-2xl scale-110" 
            style={{ 
              backgroundImage: `url(${image || "https://via.placeholder.com/800x800"})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            }} 
          />
          <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r to-transparent z-10 
            ${isDark ? 'from-gray-900 via-gray-900/80 md:via-gray-900/50' : 'from-white via-white/80 md:via-white/50'}`} 
          />
          <img 
            src={image || "https://via.placeholder.com/800x800"} 
            alt="Preview" 
            className="absolute inset-0 w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-105" 
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewHero;