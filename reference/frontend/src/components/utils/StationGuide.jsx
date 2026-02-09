import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Music2, History, ArrowRight } from 'lucide-react';

// CONFIGURATION
const AZURACAST_BASE = "http://localhost"; 
const STATION_SHORTCODE = "cytecate"; 
const STATION_ID = 1; 

export default function StationGuide() {
  const [prevSong, setPrevSong] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch History (from Now Playing)
        const npRes = await fetch(`${AZURACAST_BASE}/api/nowplaying/${STATION_SHORTCODE}`);
        const npData = await npRes.json();
        
        // Get the very last song played (index 0 is most recent)
        if (npData.song_history?.length > 0) {
            setPrevSong(npData.song_history[0]);
        }

        // 2. Fetch Schedule (for Upcoming)
        const schedRes = await fetch(`${AZURACAST_BASE}/api/station/${STATION_ID}/schedule`);
        const schedData = await schedRes.json();
        
        // Find the first event that starts in the future
        const now = new Date();
        const next = schedData.find(e => new Date(e.start) > now);
        setNextEvent(next);

      } catch (err) {
        console.error("Failed to load station data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null;

  return (
    <div className="bg-background py-20 text-primary border-t border-white/5 relative z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.2)]">
      <div className="max-w-5xl mx-auto px-6">
        
        <div className="grid md:grid-cols-2 gap-8">
            
            {/* CARD 1: JUST PLAYED */}
            <FeatureCard 
                label="Just Played"
                icon={<History size={20} />}
                data={prevSong}
                type="history"
            />

            {/* CARD 2: COMING UP NEXT */}
            <FeatureCard 
                label="Up Next"
                icon={<Calendar size={20} />}
                data={nextEvent}
                type="schedule"
            />

        </div>
      </div>
    </div>
  );
}

function FeatureCard({ label, icon, data, type }) {
    if (!data) return (
        <div className="bg-surface/30 rounded-[2rem] p-8 border border-white/5 flex items-center justify-center text-secondary h-64">
            No info available
        </div>
    );

    const fixArt = (url) => url ? (url.startsWith('http') ? url : `${AZURACAST_BASE}${url}`) : null;

    let title, subtitle, image, timeText;

    if (type === 'history') {
        title = data.song.title;
        subtitle = data.song.artist;
        image = fixArt(data.song.art);
        // Calculate "X mins ago"
        const diff = Math.floor((Date.now() / 1000) - data.played_at);
        const mins = Math.floor(diff / 60);
        timeText = `${mins} min${mins !== 1 ? 's' : ''} ago`;
    } else {
        title = data.name;
        subtitle = data.type === 'streamer' ? 'Live DJ Set' : 'AutoDJ Playlist';
        image = null; // Schedule usually lacks unique art
        
        const start = new Date(data.start);
        timeText = `Starts at ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }

    return (
        <div className="group relative bg-surface hover:bg-surface/80 transition-colors rounded-[2.5rem] p-6 border border-white/5 overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl">
            
            {/* Image Section */}
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-2xl overflow-hidden bg-black/50 border border-white/10 relative shadow-inner">
                {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary/40">
                        {type === 'history' ? <Music2 size={40} /> : <Calendar size={40} />}
                    </div>
                )}
                {/* Corner Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-2 rounded-full text-accent border border-white/10">
                    {icon}
                </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 text-center md:text-left min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest border border-accent/20">
                        {label}
                    </span>
                    <span className="text-xs font-mono text-secondary/60">
                        {timeText}
                    </span>
                </div>

                <h3 className="text-2xl font-black text-primary leading-tight mb-1 line-clamp-2 group-hover:text-accent transition-colors">
                    {title}
                </h3>
                <p className="text-lg text-secondary font-medium truncate">
                    {subtitle}
                </p>

                {/* Decorative Arrow */}
                <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-white/40 group-hover:text-white transition-colors">
                    <span>Details</span>
                    <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}