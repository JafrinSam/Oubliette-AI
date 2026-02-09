import React from 'react';
import { Mic2, Radio, CalendarClock } from 'lucide-react'; // Removed PartyPopper
import { StatCard, SectionHeader } from './DashboardWidgets';

const AdminView = ({ stats }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader 
        title="Station Operations" 
        subtitle="Live broadcast status and upcoming schedules." 
      />

      {/* KPI GRID - Removed Live Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active RJs" value={stats.activeRJs} icon={Mic2} color="bg-indigo-500" />
        <StatCard title="Total Shows" value={stats.totalShows} icon={Radio} color="bg-blue-500" />
        <StatCard title="Scheduled Today" value={stats.scheduledToday} icon={CalendarClock} color="bg-green-500" />
      </div>

      {/* BROADCAST PREVIEW */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--border-color)]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                On Air Control
            </h3>
            <button className="text-xs text-[var(--accent-color)] font-bold hover:underline">Manage Schedule &rarr;</button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center py-8 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl">
             <Radio size={40} className="opacity-50" />
             <p>No show is currently marked as LIVE manually.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminView;