import React, { useEffect, useRef, useMemo, useState } from 'react';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { DAYS, HOURS, getMinutes, stringToColor } from '../../../utils/showUtils';

const MasterCalendar = ({ shows }) => {
  const scrollRef = useRef(null);
  
  // --- NEW: Navigation State ---
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 480; }, []);

  // --- Calculate Week Dates ---
  const weekDates = useMemo(() => {
    const currentDay = currentDate.getDay(); // 0=Sun, 1=Mon
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + distanceToMonday);

    return DAYS.map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        dateObj: date,
        dayNum: date.getDate()
      };
    });
  }, [currentDate]);

  const nextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
  const prevWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
  const resetToday = () => setCurrentDate(new Date());

  const allEvents = useMemo(() => {
    return shows.flatMap(show => 
      (show.weekly_schedules || []).map(slot => ({
        ...slot, showTitle: show.title, color: stringToColor(show.title), rjName: slot.rj?.name || (show.rjs?.[0]?.name)
      }))
    );
  }, [shows]);

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] border rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-500" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      
      {/* Header with Navigation */}
      <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><LayoutGrid size={20} style={{ color: 'var(--accent-color)' }}/> Weekly Overview</h2>
          
          <div className="flex items-center gap-2 ml-4">
            <button onClick={prevWeek} className="p-1.5 rounded-lg border hover:bg-[var(--bg-primary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><ChevronLeft size={16}/></button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg border hover:bg-[var(--bg-primary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><ChevronRight size={16}/></button>
            <span className="text-sm font-bold ml-2 w-24" style={{ color: 'var(--text-secondary)' }}>
               {weekDates[0].dateObj.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <button onClick={resetToday} className="px-3 py-1.5 text-xs font-bold rounded-lg border hover:bg-[var(--bg-primary)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Today</button>
          </div>
        </div>
        <div className="text-xs font-mono px-2 py-1 rounded border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>GMT+5:30</div>
      </div>
      
      {/* Date Header Grid */}
      <div className="grid grid-cols-8 border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="p-3 text-xs font-bold text-center border-r" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>GMT</div>
        {DAYS.map((day, i) => (
          <div key={day} className="p-3 text-center border-r last:border-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{day.substring(0, 3)}</div>
            <div 
              className={`text-lg font-light opacity-80 ${new Date().toDateString() === weekDates[i].dateObj.toDateString() ? 'text-[var(--accent-color)] font-bold opacity-100' : ''}`} 
              style={{ color: new Date().toDateString() === weekDates[i].dateObj.toDateString() ? 'var(--accent-color)' : 'var(--text-primary)' }}
            >
              {weekDates[i].dayNum}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative" style={{ backgroundColor: 'var(--bg-primary)' }} ref={scrollRef}>
        <div className="grid grid-cols-8 relative min-h-[1440px]">
          <div className="border-r" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>{HOURS.map(h => (<div key={h} className="h-[60px] text-[10px] text-right pr-3 pt-2 border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>{h % 12 || 12} {h >= 12 ? 'PM' : 'AM'}</div>))}</div>
          {DAYS.map((day) => (
            <div key={day} className="relative border-r last:border-0" style={{ borderColor: 'var(--border-color)' }}>
              {HOURS.map(h => <div key={h} className="h-[60px] border-b w-full" style={{ borderColor: 'var(--border-color)', opacity: 0.3 }}></div>)}
              {allEvents.filter(e => e.day === day).map(slot => {
                const start = getMinutes(slot.startTime);
                return (
                  <div key={slot._id} className="absolute inset-x-1 rounded-md border-l-4 p-2 shadow-sm hover:shadow-md cursor-pointer transition-all z-10 hover:z-20 overflow-hidden" style={{ top: `${start}px`, height: `${getMinutes(slot.endTime) - start}px`, backgroundColor: `${slot.color}15`, borderLeftColor: slot.color, borderTop: `1px solid ${slot.color}30`, borderRight: `1px solid ${slot.color}30`, borderBottom: `1px solid ${slot.color}30` }}>
                    <div className="text-[10px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{slot.startTime} - {slot.endTime}</div>
                    <div className="font-bold text-xs truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{slot.showTitle}</div>
                    {slot.rjName && <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>🎙️ {slot.rjName}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MasterCalendar;