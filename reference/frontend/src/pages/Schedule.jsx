import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, Clock, Star, AlertCircle, Radio, Mic, User, ChevronLeft, ChevronRight, Loader2, Play } from 'lucide-react';
import useFetch from '../hooks/useFetch';

// --- CONSTANTS & HELPERS ---
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const checkIsOnAir = (targetDay, startTime, endTime) => {
  if (!startTime || !endTime || !targetDay) return false;
  const now = new Date();
  const currentDayIndex = now.getDay(); 
  const adjustedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const todayName = DAYS_OF_WEEK[adjustedIndex];
  
  if (targetDay !== todayName) return false;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = startTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const [endH, endM] = endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  
  if (endMinutes < startMinutes) return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Transform Data
const transformScheduleData = (item) => {
    const show = item.show || {}; 
    const rj = item.rj || {}; 

    return {
        id: item._id, 
        title: show.title || "Music Selection",
        subtitle: show.tagline || "Non-stop hits", 
        description: show.description || "",
        isLiveFormat: show.isLive || false,
        isHit: show.isHit || false,
        guest: show.guestName || null,
        startTime: item.startTime, 
        endTime: item.endTime,     
        day: item.day,             
        image: show.coverImage || "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?auto=format&fit=crop&q=80", 
        rjName: rj.name || "ByteCast Bot"
    };
};

// --- MAIN COMPONENT ---

export default function Schedule() {
  const [activeDay, setActiveDay] = useState("Monday");
  const [allSchedules, setAllSchedules] = useState([]); 
  
  const { get, loading } = useFetch();

  // 1. Set Active Day
  useEffect(() => {
    const todayIndex = new Date().getDay();
    const dayName = DAYS_OF_WEEK[todayIndex === 0 ? 6 : todayIndex - 1];
    setActiveDay(dayName);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchSchedules = async () => {
      const result = await get('/weekly-schedules/public');
      if (result.success && result.data?.data) {
        const transformed = result.data.data.map(transformScheduleData);
        setAllSchedules(transformed);
      }
    };
    fetchSchedules();
  }, [get]);

  // 3. Filter Data
  const dayScheduleData = useMemo(() => {
    const filtered = allSchedules.filter(item => item.day === activeDay);
    return filtered.sort((a, b) => 
        parseInt(a.startTime.replace(':','')) - parseInt(b.startTime.replace(':',''))
    );
  }, [allSchedules, activeDay]);

  // 4. Featured Item Logic
  const featuredItems = useMemo(() => {
    const currentLive = allSchedules.find(show => 
        checkIsOnAir(show.day, show.startTime, show.endTime)
    );
    if (currentLive) return [currentLive];
    const hits = dayScheduleData.filter(show => show.isHit);
    if (hits.length > 0) return hits;
    if (dayScheduleData.length > 0) return [dayScheduleData[0]];
    return [];
  }, [allSchedules, dayScheduleData]);

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-20">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto px-6 text-center mb-16">
        <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
          Live Broadcast Schedule
        </span>
        <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight mb-4">
          This Week on Air
        </h1>
        <p className="text-secondary max-w-lg mx-auto">
          Discover new sounds, live sessions, and exclusive guest mixes.
        </p>
      </div>

      {/* FEATURED SECTION */}
      <div className="max-w-5xl mx-auto px-4 mb-20 min-h-[400px]">
         {loading && allSchedules.length === 0 ? (
             <FeaturedSkeleton />
         ) : featuredItems.length > 1 ? (
             <FeaturedCarousel items={featuredItems} />
         ) : featuredItems.length === 1 ? (
             <FeaturedHero event={featuredItems[0]} />
         ) : null}
      </div>

      {/* TABS */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <div className="flex overflow-x-auto pb-4 gap-8 md:justify-center border-b border-white/10 scrollbar-hide">
            {DAYS_OF_WEEK.map(day => (
                <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap relative ${
                        activeDay === day 
                        ? 'text-primary' 
                        : 'text-secondary/50 hover:text-primary'
                    }`}
                >
                    {day}
                    {activeDay === day && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif text-center md:text-left animate-fade-in">
                {activeDay}'s Lineup
            </h2>
            {loading && <Loader2 className="animate-spin text-accent" />}
        </div>

        {loading && allSchedules.length === 0 ? (
            [...Array(3)].map((_, i) => <RowSkeleton key={i} />)
        ) : dayScheduleData.length > 0 ? (
            dayScheduleData.map((event) => (
                <ScheduleRow key={event.id} event={event} />
            ))
        ) : (
            <div className="py-20 text-center border-y border-dashed border-white/10 text-secondary">
                <AlertCircle className="mx-auto mb-2 opacity-50" />
                No shows scheduled for {activeDay}. AutoDJ is handling the vibe.
            </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FeaturedCarousel({ items }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, [items.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    };

    useEffect(() => {
        const timer = setInterval(() => nextSlide(), 6000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="relative group">
            <div className="transition-opacity duration-500 ease-in-out">
                <FeaturedHero key={items[currentIndex].id} event={items[currentIndex]} />
            </div>
            
            {/* Arrows */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-accent text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"><ChevronLeft size={24} /></button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-accent text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"><ChevronRight size={24} /></button>
            
            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {items.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all duration-300 shadow-lg ${idx === currentIndex ? 'bg-accent w-8' : 'bg-white/50 hover:bg-white w-2'}`} />
                ))}
            </div>
        </div>
    );
}

// ✅ [BETTER OPTION] Cinematic Featured Hero (Text Overlay)
// This matches the "Immersive" style of your rows for a magazine-like feel.
function FeaturedHero({ event }) {
    const isOnAir = checkIsOnAir(event.day, event.startTime, event.endTime);
    
    let labelIcon = <Star size={12} fill="currentColor" />;
    let labelText = "Featured Show"; 

    if (event.isHit) { labelText = "Trending Hit"; } 
    else if (isOnAir) { labelText = "On Air Now"; labelIcon = <Radio size={12} className="animate-pulse" />; } 
    else { labelText = "Up Next"; labelIcon = <Clock size={12} />; }

    return (
        <div className="relative h-[500px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl group border border-white/10">
            
            {/* BACKGROUND IMAGE (Zoom Effect) */}
            <img 
                src={event.image} 
                alt={event.title} 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] ease-linear group-hover:scale-110"
                loading="lazy"
            />
            
            {/* CINEMATIC GRADIENT OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent z-10" />

            {/* CONTENT */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-14 z-20 flex flex-col justify-end h-full items-start">
                <div className="max-w-4xl space-y-6">
                    
                    {/* LABELS */}
                    <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border ${event.isHit ? 'bg-accent text-white border-accent' : 'bg-white/10 text-white border-white/20'}`}>
                            {labelIcon} {labelText}
                        </span>
                        {event.isLiveFormat && <span className="flex items-center gap-1.5 bg-blue-600/90 text-white border border-blue-400/30 text-[11px] px-3 py-1.5 rounded-full font-bold backdrop-blur-md"><Mic size={11} fill="currentColor" /> STUDIO LIVE</span>}
                    </div>

                    {/* TEXT */}
                    <div>
                        <h2 className="text-5xl md:text-7xl font-serif text-white mb-3 leading-[0.95] drop-shadow-xl">{event.title}</h2>
                        <p className="text-white/80 text-lg md:text-2xl line-clamp-2 font-light max-w-2xl drop-shadow-md">{event.subtitle}</p>
                    </div>
                    
                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-accent hover:text-white transition-all transform hover:scale-105 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]">
                            {isOnAir ? <><Play size={20} fill="currentColor" /> Listen Live</> : <><Clock size={20} /> Set Reminder</>}
                        </button>
                        <div className="px-6 py-4 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white font-mono text-sm flex items-center gap-3">
                            <span className="opacity-70">{event.day}</span>
                            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                            <span className="text-accent font-bold">{formatTime(event.startTime)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ✅ Immersive Schedule Row (From your previous good update)
function ScheduleRow({ event }) {
    const isOnAir = checkIsOnAir(event.day, event.startTime, event.endTime);
    
    return (
        <div className={`group relative flex items-center overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 min-h-[140px] ${isOnAir ? 'border-accent shadow-lg shadow-accent/20' : 'border-white/10 hover:border-white/30'}`}>
            
            {/* BACKGROUND IMAGE */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={event.image} 
                    alt={event.title} 
                    className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOnAir ? 'scale-105 grayscale-0' : 'grayscale-[0.5]'}`} 
                    loading="lazy"
                />
                {/* Heavy Gradient Overlay for text readability */}
                <div className={`absolute inset-0 bg-gradient-to-r ${isOnAir ? 'from-black/95 via-black/80 to-transparent' : 'from-black/90 via-black/70 to-black/30'}`} />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 flex w-full items-center p-6 gap-6">
                
                {/* TIME BADGE */}
                <div className={`flex flex-col items-center justify-center rounded-xl p-3 backdrop-blur-md border min-w-[90px] shrink-0 ${isOnAir ? 'bg-accent text-white border-accent' : 'bg-black/40 text-white/80 border-white/10'}`}>
                    <span className="text-xl font-bold">{formatTime(event.startTime).split(' ')[0]}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">{formatTime(event.startTime).split(' ')[1]}</span>
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-2">
                        {isOnAir && <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg font-bold animate-pulse"><Radio size={10} /> LIVE</span>}
                        <span className="text-xs font-bold uppercase tracking-widest text-accent/90 truncate">{event.rjName}</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white truncate drop-shadow-md group-hover:text-accent transition-colors">{event.title}</h3>
                    <p className="text-white/60 text-sm line-clamp-1">{event.subtitle}</p>
                </div>

                {/* ACTION ICON */}
                <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-md border border-white/10 group-hover:bg-accent group-hover:border-accent transition-colors shrink-0">
                    {isOnAir ? <Play size={20} className="ml-1" fill="currentColor" /> : <Clock size={20} />}
                </div>
            </div>
        </div>
    );
}

function FeaturedSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white/5 border border-white/5 h-[500px] animate-pulse">
            <div className="absolute bottom-0 left-0 p-12 w-full space-y-4">
                <div className="h-6 w-32 bg-white/10 rounded-full"></div>
                <div className="h-16 w-3/4 bg-white/10 rounded"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                <div className="flex gap-4 pt-4"><div className="h-12 w-40 bg-white/10 rounded-full"></div></div>
            </div>
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="h-36 bg-white/5 rounded-2xl border border-white/5 flex items-center p-6 animate-pulse">
             <div className="h-20 w-20 bg-white/10 rounded-xl mr-6"></div>
             <div className="flex-1 space-y-3">
                 <div className="h-4 w-24 bg-white/10 rounded"></div>
                 <div className="h-8 w-64 bg-white/10 rounded"></div>
                 <div className="h-4 w-40 bg-white/10 rounded"></div>
             </div>
        </div>
    );
}