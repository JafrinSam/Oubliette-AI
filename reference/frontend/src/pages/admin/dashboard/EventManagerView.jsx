import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ClipboardList, CalendarDays, Plus, Clock, ArrowRight, Hourglass } from 'lucide-react';
import { StatCard, SectionHeader } from './DashboardWidgets'; 
import useFetch from '../../../hooks/useFetch'; 

// --- COMPONENT: Skeleton Row for Recent Activity ---
const ActivitySkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]/20 border border-[var(--border-color)] animate-pulse">
    <div className="flex items-center gap-3 w-full">
      {/* Status Dot Skeleton */}
      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700/50" />
      
      <div className="flex flex-col gap-2 w-full">
        {/* Title Skeleton */}
        <div className="h-4 w-3/4 max-w-[150px] bg-gray-300 dark:bg-gray-700/50 rounded" />
        {/* Metadata Skeleton */}
        <div className="flex items-center gap-2">
           <div className="h-3 w-4 bg-gray-300 dark:bg-gray-700/50 rounded" />
           <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700/50 rounded" />
           <div className="h-3 w-2 bg-gray-300 dark:bg-gray-700/50 rounded" />
           <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700/50 rounded" />
        </div>
      </div>
    </div>
    
    {/* Arrow Icon Skeleton */}
    <div className="h-8 w-8 rounded-lg bg-gray-300 dark:bg-gray-700/50 shrink-0" />
  </div>
);

const EventManagerView = ({ stats }) => { 
  const navigate = useNavigate();
  const { get, loading } = useFetch();
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    const loadRecentActivity = async () => {
      const { success, data } = await get('/events?limit=3&sort=desc');
      if (success) {
        setRecentEvents(data.data);
      }
    };
    loadRecentActivity();
  }, [get]);

  const safeStats = stats || { 
    totalEvents: 0, 
    pendingEvents: 0, 
    completedEvents: 0, 
    upcomingEvents: 0 
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader 
        title="Event Dashboard" 
        subtitle="Overview of your event portfolio and recent activity." 
      />

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
            title="Total Events" 
            value={safeStats.totalEvents} 
            icon={Ticket} 
            color="bg-blue-500" 
        />
        <StatCard 
            title="Pending Drafts" 
            value={safeStats.pendingEvents} 
            icon={ClipboardList} 
            color="bg-yellow-500" 
        />
        <StatCard 
            title="Live / Completed" 
            value={safeStats.completedEvents} 
            icon={CalendarDays} 
            color="bg-green-500" 
        />
         <StatCard 
            title="Upcoming" 
            value={safeStats.upcomingEvents} 
            icon={Hourglass} 
            color="bg-purple-500" 
        />
      </div>

      {/* MAIN ACTION AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Create Action Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center text-[var(--accent-color)] mb-4">
                    <Plus size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">Create New Event</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-6">
                    Launch a new event page. Save as draft or publish immediately to the student portal.
                </p>
            </div>
            <button 
                onClick={() => navigate('/admin/events')} 
                className="w-full py-3 rounded-xl bg-[var(--accent-color)] text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={18} /> Go to Event Manager
            </button>
        </div>

        {/* 2. Recent Activity List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Recent Activity</h3>
                <button 
                    onClick={() => navigate('/admin/events')}
                    className="text-xs font-medium text-[var(--accent-color)] hover:underline flex items-center gap-1"
                >
                    View All <ArrowRight size={12} />
                </button>
            </div>

            <div className="space-y-3">
                {/* ✅ SKELETON LOADING STATE */}
                {loading ? (
                    <>
                        <ActivitySkeleton />
                        <ActivitySkeleton />
                        <ActivitySkeleton />
                    </>
                ) : recentEvents.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-secondary)] text-sm bg-[var(--bg-secondary)]/30 rounded-xl border border-dashed border-[var(--border-color)]">
                        No events created yet.
                    </div>
                ) : (
                    recentEvents.map((event) => (
                        <div key={event._id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-colors group cursor-pointer" onClick={() => navigate('/admin/events')}>
                            <div className="flex items-center gap-3">
                                {/* Status Indicator */}
                                <div className={`w-2 h-2 rounded-full ${event.creationStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} title={event.creationStatus} />
                                
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors truncate max-w-[200px]">
                                        {event.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                        <Clock size={10} />
                                        <span>Updated {new Date(event.updatedAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="uppercase tracking-wider">{event.category}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg transition-all">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default EventManagerView;