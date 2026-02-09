import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Radio, Mic, Star } from 'lucide-react';
import { scheduleApi } from '../../services/scheduleApi'; // Make sure path is correct
import { getStrapiImage } from '../../utils/strapi'; // Make sure path is correct

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

// Returns minutes from midnight for easier comparison
const getMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const checkIsOnAir = (targetDay, startTime, endTime) => {
  if (!startTime || !endTime || !targetDay) return false;
  const now = new Date();
  const currentDayIndex = now.getDay(); 
  const adjustedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const todayName = DAYS_OF_WEEK[adjustedIndex];
  
  if (targetDay !== todayName) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = getMinutes(startTime);
  const endMinutes = getMinutes(endTime);

  if (endMinutes < startMinutes) { // Overnight show
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const transformStrapiData = (item) => {
    if (!item) return null;
    const isScheduleEntry = item.show && item.startTime;
    const show = isScheduleEntry ? item.show : item;
    const scheduleInfo = isScheduleEntry 
        ? { startTime: item.startTime, endTime: item.endTime, day: item.day }
        : (show.weekly_schedules?.[0] || { startTime: "00:00", endTime: "00:00", day: "Daily" });
    const rjsData = show.rjs || [];
    const rjName = rjsData.length > 0 ? rjsData.map(r => r.name).join(" & ") : "ByteCast Bot";

    return {
        id: item.documentId,
        title: show.Title || "Music Selection",
        isLiveFormat: show.IsLive,
        guest: show.GuestName,
        startTime: scheduleInfo.startTime,
        endTime: scheduleInfo.endTime,
        day: scheduleInfo.day,
        rjName: rjName
    };
};

export default function ScheduleWidget() {
  const [currentShow, setCurrentShow] = useState(null);
  const [nextShows, setNextShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const now = new Date();
        const currentDayIndex = now.getDay();
        const todayName = DAYS_OF_WEEK[currentDayIndex === 0 ? 6 : currentDayIndex - 1];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Fetch Today's Schedule
        const res = await scheduleApi.getByDay(todayName);
        const daySchedule = res.data.map(transformStrapiData);
        
        // Sort by start time
        daySchedule.sort((a, b) => getMinutes(a.startTime) - getMinutes(b.startTime));

        // 1. Find Current Show
        const live = daySchedule.find(show => checkIsOnAir(show.day, show.startTime, show.endTime));
        setCurrentShow(live || null);

        // 2. Find Upcoming Shows (Start time is greater than current time)
        // If there is a live show, we want shows starting AFTER the live show ends
        // If no live show, we want shows starting AFTER now
        
        const upcoming = daySchedule.filter(show => {
            const startM = getMinutes(show.startTime);
            // If show started in the past, ignore it (unless it's the current one, which we handled)
            return startM > currentMinutes;
        }).slice(0, 3); // Limit to next 3 shows

        setNextShows(upcoming);

      } catch (err) {
        console.error("Schedule Widget Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  if (loading) return null; 

  // If day is over (no live, no upcoming), show generic message or hide
  if (!currentShow && nextShows.length === 0) return (
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-background border border-border shadow-2xl rounded-3xl p-8 text-center">
            <h3 className="text-xl font-bold text-secondary">Broadcast Day Concluded</h3>
            <p className="text-sm text-secondary/70 mt-2">Check the schedule for tomorrow's lineup!</p>
        </div>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
      <div className="bg-background border border-border shadow-2xl rounded-3xl p-8 md:p-10">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Calendar size={28} />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-primary">On Air Schedule</h2>
                <p className="text-sm text-secondary font-medium">Live from SRM Trichy</p>
            </div>
          </div>
          {currentShow && (
             <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full animate-pulse border border-red-500/20">
                <Radio size={12} /> LIVE NOW
            </div>
          )}
        </div>

        <div className="space-y-4">
          
          {/* 1. CURRENTLY PLAYING (Highlighted) */}
          {currentShow ? (
            <div className="group p-6 rounded-2xl border bg-surface border-accent/50 shadow-lg shadow-accent/5 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden">
               {/* Accent Bar */}
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent"></div>

               <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
                        <Radio size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-bold text-accent uppercase tracking-wider">Now Playing</span>
                             {currentShow.isLiveFormat && (
                                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                    <Mic size={8} /> LIVE
                                </span>
                             )}
                        </div>
                        <h3 className="text-2xl font-bold text-primary leading-tight">
                            {currentShow.title}
                        </h3>
                        <p className="text-secondary font-medium mt-1 flex items-center gap-2">
                             with <span className="text-primary font-bold">{currentShow.rjName}</span>
                        </p>
                    </div>
               </div>

               <div className="mt-4 md:mt-0 text-right relative z-10">
                    <div className="text-2xl font-mono font-black text-accent">
                        {formatTime(currentShow.startTime)}
                    </div>
                    <div className="text-xs text-secondary font-mono">
                        Until {formatTime(currentShow.endTime)}
                    </div>
               </div>
            </div>
          ) : (
             // Fallback if nothing is live but shows are coming up
             <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-surface/30 text-center">
                 <p className="text-secondary italic">We are on a break. Music rotation continues.</p>
             </div>
          )}

          {/* 2. UPCOMING LIST */}
          {nextShows.length > 0 && (
             <div className="pt-2">
                 <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-secondary mb-4 ml-2">Up Next</h4>
                 <div className="space-y-3">
                    {nextShows.map((show, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-transparent bg-surface/30 hover:bg-surface hover:border-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="text-secondary/50 group-hover:text-accent transition-colors">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-primary text-lg">{show.title}</h5>
                                    <p className="text-xs text-secondary">
                                        {show.rjName} {show.guest ? `ft. ${show.guest}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right font-mono text-sm text-secondary font-medium bg-background/50 px-3 py-1 rounded-md">
                                {formatTime(show.startTime)}
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}